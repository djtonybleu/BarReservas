const Mixpanel = require('mixpanel');

class Analytics {
  constructor() {
    this.mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);
  }

  trackReservation(userId, data) {
    this.mixpanel.track('Reservation Created', {
      distinct_id: userId,
      table_type: data.tipoMesa,
      people_count: data.personas,
      has_observations: !!data.observaciones
    });
  }

  trackPayment(userId, amount, status) {
    this.mixpanel.track('Payment Processed', {
      distinct_id: userId,
      amount: amount / 100,
      status,
      currency: 'USD'
    });
  }
}

module.exports = new Analytics();