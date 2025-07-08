const axios = require('axios');

class WhatsAppNotifications {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  }

  // Send reservation confirmation
  async sendReservationConfirmation(phone, reservationData) {
    const message = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'reservation_confirmation',
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: reservationData.nombre },
              { type: 'text', text: reservationData.fecha },
              { type: 'text', text: reservationData.hora },
              { type: 'text', text: reservationData.personas.toString() }
            ]
          }
        ]
      }
    };

    return await this.sendMessage(message);
  }

  // Send QR code
  async sendQRCode(phone, qrUrl, groupName) {
    const message = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: {
        body: `🎉 ¡Hola! Tu reserva para "${groupName}" está confirmada.\n\n📱 Comparte este link con tu grupo:\n${qrUrl}\n\n✨ Cada persona debe registrarse escaneando el QR.`
      }
    };

    return await this.sendMessage(message);
  }

  // Send reminder
  async sendReminder(phone, reservationData) {
    const message = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: {
        body: `⏰ Recordatorio: Tu reserva es hoy a las ${reservationData.hora}.\n\n📍 Mesa ${reservationData.tipoMesa} para ${reservationData.personas} personas.\n\n¡Te esperamos! 🍻`
      }
    };

    return await this.sendMessage(message);
  }

  // Generic message sender
  async sendMessage(message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        message,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('WhatsApp API Error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  // Handle webhook
  static handleWebhook(body) {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      return {
        type: 'message_received',
        from: value.messages[0].from,
        text: value.messages[0].text?.body,
        timestamp: value.messages[0].timestamp
      };
    }

    return { type: 'unknown' };
  }
}

module.exports = WhatsAppNotifications;