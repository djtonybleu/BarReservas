const Joi = require('joi');
const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

// Reservation validation schema
const reservationSchema = Joi.object({
  nombre: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Name contains invalid characters'
    }),
  
  contacto: Joi.string()
    .trim()
    .min(5)
    .max(50)
    .required(),
  
  fecha: Joi.date()
    .min('now')
    .max(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 days max
    .required(),
  
  hora: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required(),
  
  personas: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required(),
  
  tipoMesa: Joi.string()
    .valid('estandar', 'vip', 'terraza')
    .required(),
  
  observaciones: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('')
});

// Member registration validation
const memberSchema = Joi.object({
  genero: Joi.string()
    .valid('masculino', 'femenino', 'otro', 'prefiero-no-decir')
    .required(),
  
  instagram: Joi.string()
    .trim()
    .pattern(/^[a-zA-Z0-9._]{1,30}$/)
    .optional()
    .allow('')
});

// QR token validation
const qrTokenSchema = Joi.object({
  token: Joi.string()
    .pattern(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/) // JWT pattern
    .required()
});

class InputValidator {
  // Sanitize HTML input
  static sanitizeHTML(input) {
    if (typeof input !== 'string') return input;
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }

  // Sanitize SQL input (additional layer)
  static sanitizeSQL(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/['";\\]/g, '');
  }

  // Validate email
  static validateEmail(email) {
    return validator.isEmail(email) && 
           validator.isLength(email, { max: 254 });
  }

  // Validate phone number
  static validatePhone(phone) {
    return validator.isMobilePhone(phone, 'any', { strictMode: false });
  }

  // Validate Instagram username
  static validateInstagram(username) {
    if (!username) return true; // Optional field
    return /^[a-zA-Z0-9._]{1,30}$/.test(username);
  }

  // Comprehensive input validation middleware
  static validateReservation(req, res, next) {
    // Sanitize inputs
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = InputValidator.sanitizeHTML(req.body[key]);
        req.body[key] = InputValidator.sanitizeSQL(req.body[key]);
      }
    });

    // Validate schema
    const { error, value } = reservationSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Additional business logic validation
    const reservationTime = new Date(`${value.fecha}T${value.hora}`);
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (reservationTime < twoHoursFromNow) {
      return res.status(400).json({
        error: 'Reservations must be made at least 2 hours in advance'
      });
    }

    // Validate contact based on type
    if (req.body.contactoTipo === 'whatsapp' && !InputValidator.validatePhone(value.contacto)) {
      return res.status(400).json({
        error: 'Invalid phone number format'
      });
    }

    if (req.body.contactoTipo === 'instagram' && !InputValidator.validateInstagram(value.contacto.replace('@', ''))) {
      return res.status(400).json({
        error: 'Invalid Instagram username format'
      });
    }

    req.validatedData = value;
    next();
  }

  static validateMember(req, res, next) {
    // Sanitize inputs
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = InputValidator.sanitizeHTML(req.body[key]);
      }
    });

    const { error, value } = memberSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.validatedData = value;
    next();
  }

  static validateQRToken(req, res, next) {
    const { error, value } = qrTokenSchema.validate({
      token: req.params.token || req.body.token || req.query.token
    });

    if (error) {
      return res.status(400).json({
        error: 'Invalid QR token format'
      });
    }

    req.qrToken = value.token;
    next();
  }
}

module.exports = {
  InputValidator,
  reservationSchema,
  memberSchema,
  qrTokenSchema
};