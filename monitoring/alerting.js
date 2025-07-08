const nodemailer = require('nodemailer');
const metricsCollector = require('./metrics-collector');

class AlertingSystem {
  constructor() {
    this.alerts = new Map();
    this.thresholds = {
      highMemoryUsage: 85,
      slowQuery: 1000,
      errorRate: 10,
      failedReservations: 5,
      systemDown: true
    };
    
    this.setupEmailTransporter();
    this.setupEventListeners();
  }

  setupEmailTransporter() {
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.ALERT_EMAIL_USER,
        pass: process.env.ALERT_EMAIL_PASS
      }
    });
  }

  setupEventListeners() {
    // High memory usage alert
    metricsCollector.on('high_memory_usage', (data) => {
      this.sendAlert('HIGH_MEMORY', {
        severity: 'WARNING',
        message: `Memory usage at ${data.memory.percentage}%`,
        data
      });
    });

    // Slow query alert
    metricsCollector.on('slow_query', (data) => {
      this.sendAlert('SLOW_QUERY', {
        severity: 'WARNING',
        message: `Slow query detected: ${data.endpoint} (${data.duration}ms)`,
        data
      });
    });

    // Failed reservation pattern
    let failedReservations = 0;
    metricsCollector.on('reservation_failed', () => {
      failedReservations++;
      if (failedReservations >= this.thresholds.failedReservations) {
        this.sendAlert('FAILED_RESERVATIONS', {
          severity: 'CRITICAL',
          message: `${failedReservations} failed reservations in short period`,
          data: { count: failedReservations }
        });
        failedReservations = 0;
      }
    });
  }

  async sendAlert(type, alert) {
    const alertKey = `${type}_${Date.now()}`;
    
    // Prevent spam - check if similar alert sent recently
    const recentAlert = Array.from(this.alerts.values())
      .find(a => a.type === type && Date.now() - a.timestamp < 300000); // 5 minutes
    
    if (recentAlert) return;

    const alertData = {
      id: alertKey,
      type,
      timestamp: Date.now(),
      ...alert
    };

    this.alerts.set(alertKey, alertData);

    // Send email notification
    await this.sendEmailAlert(alertData);
    
    // Send to monitoring dashboard
    await this.sendToWebhook(alertData);
    
    // Log alert
    console.error(`[ALERT] ${alert.severity}: ${alert.message}`);
  }

  async sendEmailAlert(alert) {
    if (!process.env.ALERT_EMAIL_TO) return;

    const mailOptions = {
      from: process.env.ALERT_EMAIL_USER,
      to: process.env.ALERT_EMAIL_TO,
      subject: `🚨 BarReservas Alert: ${alert.type}`,
      html: `
        <h2>🚨 System Alert</h2>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${new Date(alert.timestamp).toISOString()}</p>
        <pre>${JSON.stringify(alert.data, null, 2)}</pre>
      `
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  async sendToWebhook(alert) {
    if (!process.env.WEBHOOK_URL) return;

    try {
      await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${alert.severity}: ${alert.message}`,
          attachments: [{
            color: alert.severity === 'CRITICAL' ? 'danger' : 'warning',
            fields: [
              { title: 'Type', value: alert.type, short: true },
              { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: true }
            ]
          }]
        })
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  // Health check endpoint
  async getSystemStatus() {
    const metrics = await metricsCollector.getRealTimeMetrics();
    const recentAlerts = Array.from(this.alerts.values())
      .filter(alert => Date.now() - alert.timestamp < 3600000) // Last hour
      .sort((a, b) => b.timestamp - a.timestamp);

    return {
      status: recentAlerts.some(a => a.severity === 'CRITICAL') ? 'CRITICAL' : 
              recentAlerts.some(a => a.severity === 'WARNING') ? 'WARNING' : 'HEALTHY',
      metrics,
      alerts: recentAlerts.slice(0, 10),
      timestamp: Date.now()
    };
  }
}

module.exports = new AlertingSystem();