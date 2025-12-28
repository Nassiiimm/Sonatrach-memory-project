const express = require('express');
const Joi = require('joi');
const Hotel = require('../models/Hotel');
const Audit = require('../models/Audit');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const hotelSchema = Joi.object({
  name: Joi.string().required(),
  city: Joi.string().required(),
  country: Joi.string().allow('', null),
  code: Joi.string().allow('', null),
  provider: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
  prices: Joi.object({
    simple: Joi.number().min(0).required(),
    demi_pension: Joi.number().min(0).required(),
    pension_complete: Joi.number().min(0).required(),
    formule_repas: Joi.number().min(0).required()
  }).required()
});

router.get('/', auth, async (req, res) => {
  const hotels = await Hotel.find().sort({ city: 1, name: 1 });
  res.json(hotels);
});

router.post('/', auth, requireRole(['ADMIN']), async (req, res) => {
  const { error, value } = hotelSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const hotel = await Hotel.create({
    ...value,
    country: value.country || 'Algérie'
  });
  await Audit.create({
    action: 'CREATE_HOTEL',
    entity: 'Hotel',
    entityId: hotel._id.toString(),
    by: req.user._id,
    metadata: { city: hotel.city, provider: hotel.provider }
  });
  res.status(201).json(hotel);
});

module.exports = router;