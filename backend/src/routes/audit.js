const express = require('express');
const Audit = require('../models/Audit');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, requireRole(['ADMIN']), async (req, res) => {
  const audit = await Audit.find().sort({ createdAt: -1 }).limit(200).populate('by', 'name role');
  res.json(audit);
});

module.exports = router;