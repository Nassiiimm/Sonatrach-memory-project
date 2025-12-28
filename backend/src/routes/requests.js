const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Joi = require('joi');
const Request = require('../models/Request');
const Audit = require('../models/Audit');
const Hotel = require('../models/Hotel');
const { auth, requireRole } = require('../middleware/auth');
const STATUS = require('../constants/status');
const { generateBCPdf, generateBCNumber } = require('../utils/pdfGenerator');
const { storePdfBuffer, getPdfById } = require('../utils/gridfs');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../files');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ✅ Schéma de validation enrichi
const createSchema = Joi.object({
  destination: Joi.string().min(2).required(),
  city: Joi.string().allow('', null),
  country: Joi.string().allow('', null),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  motif: Joi.string().allow('', null),
  extraRequests: Joi.string().allow('', null),

  // Suggestion d'hôtel par l'employé
  suggestedHotelName: Joi.string().allow('', null),
  suggestedHotelCity: Joi.string().allow('', null),
  suggestedHotelNotes: Joi.string().allow('', null),

  // Réservation groupée : liste d'IDs / codes en chaîne
  participants: Joi.array().items(Joi.string()).default([])
});

router.get('/', auth, async (req, res) => {
  const { status, q, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { destination: { $regex: q, $options: 'i' } },
      { motif: { $regex: q, $options: 'i' } },
      { city: { $regex: q, $options: 'i' } }
    ];
  }

  // Filtrage par rôle
  if (req.user.role === 'EMPLOYE') {
    // L'employé ne voit que ses propres demandes
    filter.employee = req.user._id;
  } else if (req.user.role === 'MANAGER') {
    // Le manager ne voit que les demandes de sa région
    filter.regionAcronym = req.user.regionAcronym;
  }
  // RELEX, FINANCE, ADMIN voient toutes les demandes

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Request.find(filter)
      .populate('employee', 'name matricule department region regionAcronym')
      .populate('relex.hotel')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Request.countDocuments(filter)
  ]);

  res.json({ data: items, total, page: Number(page), limit: Number(limit) });
});

router.post('/', auth, requireRole(['EMPLOYE']), upload.array('attachments'), async (req, res) => {
  // On récupère brut le champ participants (FormData -> string)
  const participantsRaw = req.body.participants;
  let participants = [];

  if (Array.isArray(participantsRaw)) {
    participants = participantsRaw;
  } else if (typeof participantsRaw === 'string' && participantsRaw.trim()) {
    participants = participantsRaw
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  }

  const payload = {
    destination: req.body.destination,
    city: req.body.city,
    country: req.body.country,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    motif: req.body.motif,
    extraRequests: req.body.extraRequests,

    // Suggestion d'hôtel
    suggestedHotelName: req.body.suggestedHotelName,
    suggestedHotelCity: req.body.suggestedHotelCity,
    suggestedHotelNotes: req.body.suggestedHotelNotes,

    // Réservation groupée
    participants
  };

  const { error, value } = createSchema.validate(payload);
  if (error) return res.status(400).json({ message: error.message });

  const attachments = (req.files || []).map(f => f.filename);
  const request = await Request.create({
    destination: value.destination,
    city: value.city,
    country: value.country || 'Algérie',
    startDate: value.startDate,
    endDate: value.endDate,
    motif: value.motif,
    extraRequests: value.extraRequests,

    // Enregistrement suggestion d'hôtel
    suggestedHotel: {
      name: value.suggestedHotelName,
      city: value.suggestedHotelCity,
      notes: value.suggestedHotelNotes
    },

    // Participants groupés (optionnel)
    participants: value.participants,

    employee: req.user._id,
    regionAcronym: req.user.regionAcronym, // Copie de la région de l'employé
    attachments,
    status: STATUS.EN_ATTENTE_MANAGER
  });

  await Audit.create({
    action: 'CREATE_REQUEST',
    entity: 'Request',
    entityId: request._id.toString(),
    by: req.user._id,
    metadata: { destination: request.destination, city: request.city }
  });

  res.status(201).json(request);
});

// Manager: libère ou refuse l'employé, ne réserve rien
router.patch('/:id/manager', auth, requireRole(['MANAGER']), async (req, res) => {
  const { approved, comment } = req.body;
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Demande introuvable' });

  // Vérification que la demande appartient à la région du manager
  if (request.regionAcronym !== req.user.regionAcronym) {
    return res.status(403).json({ message: 'Vous ne pouvez valider que les demandes de votre région' });
  }

  request.managerDecision = { approved, comment, at: new Date() };

  if (approved) {
    request.status = STATUS.EN_ATTENTE_RELEX;
  } else {
    request.status = STATUS.REFUSEE;
  }

  await request.save();
  await Audit.create({
    action: approved ? 'VALIDATE_REQUEST_MANAGER' : 'REJECT_REQUEST_MANAGER',
    entity: 'Request',
    entityId: request._id.toString(),
    by: req.user._id,
    metadata: { comment, regionAcronym: request.regionAcronym }
  });

  res.json(request);
});

// Relex: choisit l'hôtel & formule, génère BC + options + PDF automatique
router.patch('/:id/relex', auth, requireRole(['RELEX']), async (req, res) => {
  try {
    const {
      hotelId,
      formula,
      finalStartDate,
      finalEndDate,
      comment,
      roomType,
      allowCancellation,
      allowHotelChange,
      isLateReservation,
      isPostStayEntry
    } = req.body;

    // On populate employee pour pouvoir faire un snapshot dans le BC
    const request = await Request.findById(req.params.id).populate('employee');
    if (!request) return res.status(404).json({ message: 'Demande introuvable' });

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(400).json({ message: 'Hôtel invalide' });

    const start = new Date(finalStartDate || request.startDate);
    const end = new Date(finalEndDate || request.endDate);
    const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

    // Détermination du prix en fonction de la formule et de l'hôtel
    let pricePerNight = 0;
    const formulaKey = (formula || '').toUpperCase();
    switch (formulaKey) {
      case 'SEJOUR_SIMPLE':
        pricePerNight = hotel.prices?.simple || 0;
        break;
      case 'FORMULE_REPAS':
        pricePerNight = hotel.prices?.formule_repas || 0;
        break;
      case 'DEMI_PENSION':
        pricePerNight = hotel.prices?.demi_pension || 0;
        break;
      case 'PENSION_COMPLETE':
        pricePerNight = hotel.prices?.pension_complete || 0;
        break;
      default:
        pricePerNight = hotel.prices?.simple || 0;
    }

    const total = nights * Number(pricePerNight || 0);

    // Génération du numéro de BC unique
    const bcNumber = await generateBCNumber(Request);

    // Bloc Relex avec options
    request.relex = {
      hotel: hotel._id,
      formula,
      finalStartDate: start,
      finalEndDate: end,
      comment,
      roomType,
      options: {
        allowCancellation: !!allowCancellation,
        allowHotelChange: !!allowHotelChange,
        isLateReservation: !!isLateReservation,
        isPostStayEntry: !!isPostStayEntry
      }
    };

    // Snapshot employé complet (pour identification sur BC)
    const employee = request.employee || {};
    const employeeSnapshot = {
      matricule: employee.matricule,
      name: employee.name,
      regionAcronym: employee.regionAcronym,
      region: employee.region,
      serviceImputation: employee.serviceImputation,
      department: employee.department
    };

    const now = new Date();
    request.finance = {
      nights,
      pricePerNight,
      total,
      currency: 'DZD',
      bcNumber,
      bcGeneratedAt: now,
      validatedAt: now,
      paymentStatus: 'NON_PAYE',
      paymentDate: null,
      employeeSnapshot,
      participantsCount: (request.participants || []).length + 1
    };

    request.status = STATUS.RESERVEE;

    // Génération du PDF et stockage dans GridFS
    try {
      const pdfBuffer = await generateBCPdf(request, hotel, bcNumber);
      const pdfId = await storePdfBuffer(pdfBuffer, `${bcNumber}.pdf`, {
        requestId: request._id.toString(),
        bcNumber,
        employeeName: employee.name,
        hotel: hotel.name
      });
      request.finance.bcPdfId = pdfId;
      console.log(`PDF BC généré et stocké: ${bcNumber} (GridFS ID: ${pdfId})`);
    } catch (pdfError) {
      console.error('Erreur génération/stockage PDF:', pdfError);
      // On continue même si le PDF échoue - il pourra être régénéré
    }

    await request.save();

    await Audit.create({
      action: 'RELEX_RESERVATION',
      entity: 'Request',
      entityId: request._id.toString(),
      by: req.user._id,
      metadata: {
        hotel: hotel.name,
        city: hotel.city,
        formula,
        bcNumber,
        total,
        nights
      }
    });

    // Repopuler l'hôtel pour la réponse
    await request.populate('relex.hotel');

    res.json(request);
  } catch (error) {
    console.error('Erreur route Relex:', error);
    res.status(500).json({ message: 'Erreur lors du traitement de la réservation' });
  }
});

// Téléchargement du BC PDF depuis GridFS
router.get('/:id/bc', auth, requireRole(['FINANCE', 'ADMIN', 'RELEX']), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('employee')
      .populate('relex.hotel');

    if (!request) {
      return res.status(404).json({ message: 'Demande introuvable' });
    }

    if (!request.finance || !request.finance.bcNumber) {
      return res.status(400).json({ message: 'Aucun BC généré pour cette demande' });
    }

    const bcNumber = request.finance.bcNumber;

    // Si le PDF est stocké dans GridFS
    if (request.finance.bcPdfId) {
      try {
        const { stream, file } = await getPdfById(request.finance.bcPdfId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${bcNumber}.pdf"`);
        res.setHeader('Content-Length', file.length);

        stream.pipe(res);
        return;
      } catch (gridfsError) {
        console.error('Erreur lecture GridFS, régénération à la volée:', gridfsError);
        // Continuer avec la régénération
      }
    }

    // Régénération à la volée si pas de PDF stocké
    const hotel = request.relex?.hotel || {};
    const pdfBuffer = await generateBCPdf(request, hotel, bcNumber);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${bcNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Erreur téléchargement BC:', err);
    res.status(500).json({ message: 'Erreur lors du téléchargement du BC PDF' });
  }
});

// Route pour marquer une réservation comme payée (FINANCE uniquement)
router.patch('/:id/payment', auth, requireRole(['FINANCE', 'ADMIN']), async (req, res) => {
  try {
    const { paymentStatus, paymentReference, paymentNote } = req.body;

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Demande introuvable' });
    }

    if (request.status !== STATUS.RESERVEE) {
      return res.status(400).json({ message: 'Seules les réservations confirmées peuvent être marquées comme payées' });
    }

    if (!request.finance) {
      return res.status(400).json({ message: 'Aucune information financière pour cette demande' });
    }

    // Mise à jour du statut de paiement
    request.finance.paymentStatus = paymentStatus || 'PAYE';
    if (paymentStatus === 'PAYE') {
      request.finance.paymentDate = new Date();
    }
    if (paymentReference) {
      request.finance.paymentReference = paymentReference;
    }
    if (paymentNote) {
      request.finance.paymentNote = paymentNote;
    }

    await request.save();

    await Audit.create({
      action: 'UPDATE_PAYMENT_STATUS',
      entity: 'Request',
      entityId: request._id.toString(),
      by: req.user._id,
      metadata: {
        bcNumber: request.finance.bcNumber,
        paymentStatus: request.finance.paymentStatus,
        paymentReference,
        total: request.finance.total
      }
    });

    res.json(request);
  } catch (err) {
    console.error('Erreur mise à jour paiement:', err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du paiement' });
  }
});

// Route pour les statistiques Finance
router.get('/finance/stats', auth, requireRole(['FINANCE', 'ADMIN']), async (req, res) => {
  try {
    const stats = await Request.aggregate([
      { $match: { status: STATUS.RESERVEE } },
      {
        $group: {
          _id: '$finance.paymentStatus',
          count: { $sum: 1 },
          total: { $sum: '$finance.total' }
        }
      }
    ]);

    const result = {
      totalReservations: 0,
      totalAmount: 0,
      paid: { count: 0, amount: 0 },
      unpaid: { count: 0, amount: 0 }
    };

    stats.forEach(s => {
      result.totalReservations += s.count;
      result.totalAmount += s.total || 0;
      if (s._id === 'PAYE') {
        result.paid = { count: s.count, amount: s.total || 0 };
      } else {
        result.unpaid = { count: s.count, amount: s.total || 0 };
      }
    });

    res.json(result);
  } catch (err) {
    console.error('Erreur stats finance:', err);
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques' });
  }
});

module.exports = router;