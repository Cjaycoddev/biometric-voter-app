const { createUser, findByEmail, findByPhone, verifyPassword } = require('../models/User');
const { generateToken } = require('../middleware/auth');
const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?254\d{9}$/).required().messages({
    'string.pattern.base': 'Phone must be a valid Kenyan number starting with +254 or 254',
  }),
  full_name: Joi.string().min(2).max(100).required(),
  id_number: Joi.string().pattern(/^\d{7,8}$/).required().messages({
    'string.pattern.base': 'ID number must be 7-8 digits (Kenyan national ID)',
  }),
  password: Joi.string().min(8).max(128).required(),
  polling_station: Joi.string().max(200).allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

async function register(req, res) {
  const { error } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
  }
  const { email, phone, full_name, id_number, password, polling_station } = req.body;

  const existingEmail = await findByEmail(email);
  if (existingEmail) return res.status(409).json({ error: 'Email already registered' });

  const existingPhone = await findByPhone(phone);
  if (existingPhone) return res.status(409).json({ error: 'Phone already registered' });

  const user = await createUser({ email, phone, full_name, id_number, password, role: 'voter', polling_station });
  const token = generateToken(user);

  return res.status(201).json({
    message: 'Registration successful',
    token,
    user: { id: user.id, email: user.email, phone: user.phone, full_name: user.full_name, role: user.role, polling_station: user.polling_station },
  });
}

async function login(req, res) {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
  }
  const { email, password } = req.body;

  const user = await findByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken(user);

  return res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, email: user.email, phone: user.phone, full_name: user.full_name, role: user.role, polling_station: user.polling_station },
  });
}

module.exports = { register, login };