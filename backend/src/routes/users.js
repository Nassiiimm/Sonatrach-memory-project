const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const Audit = require('../models/Audit');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const userSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
  role: Joi.string().valid('EMPLOYE','MANAGER','RELEX','FINANCE','ADMIN').required(),
  department: Joi.string().allow('', null),
  region: Joi.string().allow('', null)
});

router.get('/', auth, requireRole(['ADMIN']), async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

router.post('/', auth, requireRole(['ADMIN']), async (req, res) => {
  const { error, value } = userSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const user = await User.create(value);
  await Audit.create({ 
    action: 'CREATE_USER', 
    entity: 'User', 
    entityId: user._id.toString(), 
    by: req.user._id,
    metadata: { role: user.role, department: user.department, region: user.region }
  });
  const safe = user.toObject();
  delete safe.password;
  res.status(201).json(safe);
});

module.exports = router;