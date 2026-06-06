import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

export const propertySchema = Joi.object({
  houseNumber: Joi.string().required().max(20),
  tenantName: Joi.string().allow('').max(100),
  phoneNumber: Joi.string().allow('').max(20),
  isVacant: Joi.boolean(),
  waterMeterPricePerUnit: Joi.number().min(1).required(),
  lastReading: Joi.number().min(0),
  currentReading: Joi.number().min(0),
  ownerDetails: Joi.object({
    name: Joi.string().allow('').max(100),
    phone: Joi.string().allow('').max(20)
  })
});

export const readingsSchema = Joi.object({
  readings: Joi.array().items(
    Joi.object({
      houseId: Joi.string().required(),
      currentReading: Joi.number().integer().min(0).required()
        .messages({
          'number.base': 'Reading must be a number',
          'number.integer': 'Reading must be a whole number',
          'number.min': 'Reading cannot be negative',
          'any.required': 'currentReading is required'
        })
    })
  ).min(1).required()
});

export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(d => d.message);
    return res.status(400).json({ error: 'Validation failed', details: messages });
  }
  next();
};
