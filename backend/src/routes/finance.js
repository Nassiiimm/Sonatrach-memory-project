const express = require('express');
const Joi = require('joi');
const Request = require('../models/Request');
const Audit = require('../models/Audit');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Mise à jour des informations de paiement par la Finance (aval)
const financeSchema = Joi.object({
  paymentStatus: Joi.string().valid('NON_PAYE', 'PAYE').required(),
  paymentDate: Joi.date().allow(null)
});

router.patch('/:id/validate', auth, requireRole(['FINANCE']), async (req, res) => {
  const { error, value } = financeSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Demande introuvable' });

  if (!request.finance || !request.finance.poNumber) {
    return res.status(400).json({ message: 'Aucun bon de commande (BC) généré pour cette demande.' });
  }

  const paymentDate = value.paymentDate || (value.paymentStatus === 'PAYE' ? new Date() : null);

  request.finance = {
    ...(request.finance || {}),
    paymentStatus: value.paymentStatus,
    paymentDate
  };

  await request.save();

  await Audit.create({
    action: 'FINANCE_UPDATE',
    entity: 'Request',
    entityId: request._id.toString(),
    by: req.user._id,
    metadata: { 
      paymentStatus: value.paymentStatus,
      paymentDate,
      poNumber: request.finance.poNumber 
    }
  });

  res.json({
    paymentStatus: request.finance.paymentStatus,
    paymentDate: request.finance.paymentDate,
    poNumber: request.finance.poNumber
  });
});

module.exports = router;
