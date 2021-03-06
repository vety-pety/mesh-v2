import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { task } from 'ember-concurrency';
import { action } from 'ember-decorators/object';
import StoreCleaner from '../utils/jsonapi/store-cleaner';

const SERIALIZED_RELATIONS = ['animals'];

export default Controller.extend({
  i18n: service(),
  store: service(),
  session: service(),
  selectedSubscriptionPlan: alias('model'),

  queryParams: {
    subscriptionId: 'paket',
  },

  user: null,
  animal: null,

  errorList: [],

  init() {
    this._super(...arguments);

    let user = this.get('store').createRecord('user');
    this.set('user', user);
    this.set('animal', this.get('store').createRecord('animal', { user }));
    if (this.get('session.isAuthenticated')) {
      this.incrementProperty('_currentStep');
    }
  },

  _currentStep: 0,

  makePaymentAndSaveTask: task(function*() {
    this.set('errorList', []);
    try {
      let user = this.get('user');
      if (!user.get('id')) {
        const storeCleaner = new StoreCleaner(
          this.get('store'),
          user,
          SERIALIZED_RELATIONS.join(',')
        );
        const saveOptions = {
          adapterOptions: {
            tree: storeCleaner.tree,
          },
        };

        yield user.save(saveOptions).then(() => {
          storeCleaner.clean();
        });
      }

      yield this.get('selectedSubscriptionPlan').makePayment(
        this.get('selectedSubscriptionPlan.id'),
        user.get('id')
      );

      this.transitionToRoute('animal.index');
    } catch (e) {
      this.set('_currentStep', 0);
      this.set('errorList', e.errors);
    }
  }),

  @action
  nextStep() {
    this.incrementProperty('_currentStep');
  },
});
