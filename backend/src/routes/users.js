const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const Audit = require('../models/Audit');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const userSchema = Joi.object({
  matricule: Joi.string().min(2).required(),
  firstName: Joi.string().allow('', null),
  lastName: Joi.string().allow('', null),
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('EMPLOYE', 'MANAGER', 'RELEX', 'FINANCE', 'ADMIN').required(),
  regionAcronym: Joi.string().allow('', null),
  serviceImputation: Joi.string().allow('', null),
  department: Joi.string().allow('', null),
  region: Joi.string().allow('', null)
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().allow('', null),
  lastName: Joi.string().allow('', null),
  name: Joi.string().min(2),
  email: Joi.string().email(),
  password: Joi.string().min(8),
  role: Joi.string().valid('EMPLOYE', 'MANAGER', 'RELEX', 'FINANCE', 'ADMIN'),
  regionAcronym: Joi.string().allow('', null),
  serviceImputation: Joi.string().allow('', null),
  department: Joi.string().allow('', null),
  region: Joi.string().allow('', null),
  isActive: Joi.boolean()
});

router.get('/', auth, requireRole(['ADMIN']), async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

router.post('/', auth, requireRole(['ADMIN']), async (req, res) => {
  const { error, value } = userSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const user = await User.create(value);
    await Audit.create({
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user._id.toString(),
      by: req.user._id,
      metadata: { role: user.role, regionAcronym: user.regionAcronym }
    });
    const safe = user.toObject();
    delete safe.password;
    res.status(201).json(safe);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} déjà utilisé` });
    }
    throw err;
  }
});

// Mettre à jour un utilisateur
router.patch('/:id', auth, requireRole(['ADMIN']), async (req, res) => {
  const { error, value } = updateUserSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    Object.assign(user, value);
    await user.save();

    await Audit.create({
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user._id.toString(),
      by: req.user._id,
      metadata: { changes: Object.keys(value) }
    });

    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} déjà utilisé` });
    }
    throw err;
  }
});

// Activer/Désactiver un utilisateur
router.patch('/:id/toggle', auth, requireRole(['ADMIN']), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

  user.isActive = !user.isActive;
  await user.save();

  await Audit.create({
    action: user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
    entity: 'User',
    entityId: user._id.toString(),
    by: req.user._id
  });

  const safe = user.toObject();
  delete safe.password;
  res.json(safe);
});

module.exports = router;