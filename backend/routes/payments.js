const express = require('express');
const StripePayments = require('../../integrations/payments/stripe');
const { pool } = require('../../database/connection_config');

const router = express.Router();

// Create payment intent
router.post('/create-intent', async (req, res) => {
  try {
    const { reservationId } = req.body;
    
    // Get reservation details
    const reservation = await pool.query(
      'SELECT * FROM reservations WHERE id = $1',
      [reservationId]
    );
    
    if (reservation.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    const paymentIntent = await StripePayments.createPaymentIntent(reservation.rows[0]);
    
    res.json(paymentIntent);
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = StripePayments.handleWebhook(req.body, signature);
    
    if (event.type === 'payment_success') {
      // Update reservation status
      await pool.query(
        'UPDATE reservations SET status = $1, payment_status = $2 WHERE id = $3',
        ['confirmed', 'paid', event.data.metadata.reservation_id]
      );
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook failed' });
  }
});

module.exports = router;