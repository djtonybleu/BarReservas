const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripePayments {
  // Create payment intent for reservation
  static async createPaymentIntent(reservationData) {
    const { personas, tipoMesa } = reservationData;
    
    // Pricing logic
    const basePrices = {
      estandar: 1000, // $10.00
      vip: 2000,      // $20.00
      terraza: 1500   // $15.00
    };
    
    const amount = basePrices[tipoMesa] * personas;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        reservation_id: reservationData.id,
        table_type: tipoMesa,
        people_count: personas.toString()
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amount,
      currency: 'usd'
    };
  }

  // Confirm payment
  static async confirmPayment(paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  }

  // Create customer
  static async createCustomer(customerData) {
    return await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      phone: customerData.phone
    });
  }

  // Webhook handler
  static handleWebhook(payload, signature) {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        return { type: 'payment_success', data: event.data.object };
      case 'payment_intent.payment_failed':
        return { type: 'payment_failed', data: event.data.object };
      default:
        return { type: 'unknown', data: event.data.object };
    }
  }
}

module.exports = StripePayments;