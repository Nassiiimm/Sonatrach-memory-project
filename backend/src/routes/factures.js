const express = require('express');
const Joi = require('joi');
const Facture = require('../models/Facture');
const Audit = require('../models/Audit');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Schéma de validation création
const createSchema = Joi.object({
  hotel: Joi.string().required(),
  numeroFacture: Joi.string().required(),
  dateFacture: Joi.date().required(),
  dateReception: Joi.date(),
  montant: Joi.number().positive().required(),
  devise: Joi.string().valid('DZD', 'EUR', 'USD').default('DZD'),
  reservations: Joi.array().items(Joi.string()),
  periodeDebut: Joi.date(),
  periodeFin: Joi.date(),
  observations: Joi.string().allow('', null)
});

// Schéma de validation mise à jour
const updateSchema = Joi.object({
  statut: Joi.string().valid('EN_ATTENTE', 'VALIDEE', 'PAYEE', 'REJETEE'),
  datePaiement: Joi.date(),
  numeroBonPaiement: Joi.string().allow('', null),
  observations: Joi.string().allow('', null)
});

// GET /api/factures - Liste des factures
router.get('/', auth, requireRole(['FINANCE', 'ADMIN']), async (req, res) => {
  const { statut, hotel, page = 1, limit = 50, startDate, endDate } = req.query;
  const filter = {};

  if (statut) filter.statut = statut;
  if (hotel) filter.hotel = hotel;
  if (startDate || endDate) {
    filter.dateFacture = {};
    if (startDate) filter.dateFacture.$gte = new Date(startDate);
    if (endDate) filter.dateFacture.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Facture.find(filter)
      .populate('hotel', 'name city')
      .populate('saisieePar', 'name')
      .populate('traiteePar', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Facture.countDocuments(filter)
  ]);

  res.json({ data: items, total, page: Number(page), limit: Number(limit) });
});

// GET /api/factures/stats - Statistiques
router.get('/stats', auth, requireRole(['FINANCE', 'ADMIN']), async (req, res) => {
  const [enAttente, validees, payees, rejetees] = await Promise.all([
    Facture.aggregate([
      { $match: { statut: 'EN_ATTENTE' } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$montant' } } }
    ]),
    Facture.aggregate([
      { $match: { statut: 'VALIDEE' } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$montant' } } }
    ]),
    Facture.aggregate([
      { $match: { statut: 'PAYEE' } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$montant' } } }
    ]),
    Facture.aggregate([
      { $match: { statut: 'REJETEE' } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$montant' } } }
    ])
  ]);

  res.json({
    enAttente: enAttente[0] || { count: 0, total: 0 },
    validees: validees[0] || { count: 0, total: 0 },
    payees: payees[0] || { count: 0, total: 0 },
    rejetees: rejetees[0] || { count: 0, total: 0 }
  });
});

// POST /api/factures - Créer une facture
router.post('/', auth, requireRole(['FINANCE', 'ADMIN']), async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const facture = await Facture.create({
      ...value,
      saisieePar: req.user._id,
      statut: 'EN_ATTENTE'
    });

    await Audit.create({
      action: 'CREATE_FACTURE',
      entity: 'Facture',
      entityId: facture._id.toString(),
      by: req.user._id,
      metadata: { numeroFacture: facture.numeroFacture, montant: facture.montant }
    });

    const populated = await Facture.findById(facture._id)
      .populate('hotel', 'name city')
      .populate('saisieePar', 'name');

    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Numéro de facture déjà existant' });
    }
    throw err;
  }
});

// GET /api/factures/:id - Détail d'une facture
router.get('/:id', auth, requireRole(['FINANCE', 'ADMIN']), async (req, res) => {
  const facture = await Facture.findById(req.params.id)
    .populate('hotel')
    .populate('reservations')
    .populate('saisieePar', 'name')
    .populate('traiteePar', 'name');

  if (!facture) return res.status(404).json({ message: 'Facture non trouvée' });
  res.json(facture);
});

// PATCH /api/factures/:id - Mettre à jour le statut
router.patch('/:id', auth, requireRole(['FINANCE', 'ADMIN']), async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const facture = await Facture.findById(req.params.id);
  if (!facture) return res.status(404).json({ message: 'Facture non trouvée' });

  const previousStatut = facture.statut;
  Object.assign(facture, value);

  // Si passage à PAYEE, enregistrer qui a traité
  if (value.statut && value.statut !== previousStatut) {
    facture.traiteePar = req.user._id;
    if (value.statut === 'PAYEE' && !facture.datePaiement) {
      facture.datePaiement = new Date();
    }
  }

  await facture.save();

  await Audit.create({
    action: 'UPDATE_FACTURE',
    entity: 'Facture',
    entityId: facture._id.toString(),
    by: req.user._id,
    metadata: {
      previousStatut,
      newStatut: facture.statut,
      changes: Object.keys(value)
    }
  });

  const populated = await Facture.findById(facture._id)
    .populate('hotel', 'name city')
    .populate('saisieePar', 'name')
    .populate('traiteePar', 'name');

  res.json(populated);
});

// DELETE /api/factures/:id - Supprimer (seulement EN_ATTENTE)
router.delete('/:id', auth, requireRole(['ADMIN']), async (req, res) => {
  const facture = await Facture.findById(req.params.id);
  if (!facture) return res.status(404).json({ message: 'Facture non trouvée' });

  if (facture.statut !== 'EN_ATTENTE') {
    return res.status(400).json({ message: 'Seules les factures en attente peuvent être supprimées' });
  }

  await facture.deleteOne();

  await Audit.create({
    action: 'DELETE_FACTURE',
    entity: 'Facture',
    entityId: req.params.id,
    by: req.user._id,
    metadata: { numeroFacture: facture.numeroFacture }
  });

  res.json({ message: 'Facture supprimée' });
});

module.exports = router;
