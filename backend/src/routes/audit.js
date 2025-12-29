const express = require('express');
const Audit = require('../models/Audit');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, requireRole(['ADMIN']), async (req, res) => {
  const { page = 1, limit = 50, action, entity } = req.query;
  const filter = {};

  if (action) filter.action = action;
  if (entity) filter.entity = entity;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Audit.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('by', 'name role'),
    Audit.countDocuments(filter)
  ]);

  res.json({ data: items, total, page: Number(page), limit: Number(limit) });
});

module.exports = router;