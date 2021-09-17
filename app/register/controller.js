import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { task } from 'ember-concurrency';
import { action } from 'ember-decorators/object';

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

  init() {
    this._super(...arguments);

    this.set('user', this.get('store').createRecord('user'));
    this.set('animal', this.get('store').createRecord('animal'));
    if (this.get('session.isAuthenticated')) {
      this.incrementProperty('_currentStep');
    }
  },

  _currentStep: 0,

  makePaymentAndSaveTask: task(function*() {
    yield this.get('selectedSubscriptionPlan').makePayment(
      this.get('selectedSubscriptionPlan.id'),
      {
        user: this.get('user'),
        animal: this.get('animal'),
      }
    );

    this.transitionToRoute('animal.index');
  }),

  @action
  nextStep() {
    this.incrementProperty('_currentStep');
  },
});
