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
const PDFDocument = require('pdfkit');

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

// Relex: choisit l'hôtel & formule, génère BC + options
router.patch('/:id/relex', auth, requireRole(['RELEX']), async (req, res) => {
  const { 
    hotelId, 
    formula, 
    finalStartDate, 
    finalEndDate, 
    comment,

    // champs supplémentaires possibles côté frontend / modèle
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

  // Génération du numéro de BC si absent
  const existingFinance = request.finance || {};
  const poNumber = existingFinance.poNumber 
    || `BC-${new Date().getFullYear()}-${request._id.toString().slice(-6).toUpperCase()}`;

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

  // Snapshot employé (pour identification sur BC)
  const employee = request.employee || {};
  const employeeSnapshot = {
    matricule: employee.matricule,
    name: employee.name,
    regionAcronym: employee.regionAcronym,
    serviceImputation: employee.serviceImputation
  };

  request.finance = {
    ...existingFinance,
    nights,
    pricePerNight,
    total,
    currency: existingFinance.currency || 'DZD',
    poNumber,
    validatedAt: existingFinance.validatedAt || new Date(),
    paymentStatus: existingFinance.paymentStatus || 'NON_PAYE',
    paymentDate: existingFinance.paymentDate || null,
    employeeSnapshot,
    participantsCount: (request.participants || []).length + 1
  };

  request.status = STATUS.RESERVEE;
  await request.save();

  await Audit.create({
    action: 'RELEX_RESERVATION',
    entity: 'Request',
    entityId: request._id.toString(),
    by: req.user._id,
    metadata: { hotel: hotel.name, city: hotel.city, formula, poNumber }
  });

  res.json(request);
});

router.get('/:id/bc', auth, requireRole(['FINANCE', 'ADMIN']), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('employee')
      .populate('relex.hotel');

    if (!request) {
      return res.status(404).json({ message: 'Demande introuvable' });
    }

    if (!request.finance) {
      return res.status(400).json({ message: 'Aucun BC généré pour cette demande' });
    }

    const poNumber = request.finance.poNumber || `BC-${request._id.toString().slice(-8)}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${poNumber}.pdf"`
    );

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // ---- ENTÊTE ----
    doc
      .fontSize(10)
      .text('SONATRACH', { align: 'left' })
      .moveDown(0.2);
    doc
      .fontSize(9)
      .text('Division Production', { align: 'left' })
      .text('Direction Finance & Comptabilité', { align: 'left' });

    doc
      .fontSize(14)
      .text('BON DE COMMANDE HÉBERGEMENT', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text(`N° BC : ${poNumber}`, { align: 'right' })
      .text(
        `Date : ${new Date(request.finance.validatedAt || request.createdAt).toLocaleDateString('fr-DZ')}`,
        { align: 'right' }
      )
      .moveDown(0.5);

    // ---- INFOS EMPLOYÉ / IMPUTATION ----
    const snap = request.finance.employeeSnapshot || {};
    const emp = request.employee || {};

    doc
      .fontSize(10)
      .text('INFORMATIONS EMPLOYÉ', { underline: true })
      .moveDown(0.2);

    doc.text(`Matricule : ${snap.matricule || emp.matricule || '-'}`);
    doc.text(`Nom & prénom : ${snap.name || emp.name || '-'}`);
    doc.text(`Région : ${snap.regionAcronym || emp.regionAcronym || '-'}`);
    doc.text(`Service / imputation : ${snap.serviceImputation || emp.serviceImputation || '-'}`);
    doc.moveDown(0.8);

    // ---- INFOS HÔTEL / SÉJOUR ----
    const hotel = request.relex?.hotel || {};
    const nights = request.finance.nights || 0;
    const pricePerNight = request.finance.pricePerNight || 0;
    const total = request.finance.total || nights * pricePerNight;

    doc
      .fontSize(10)
      .text('INFORMATIONS HÔTEL', { underline: true })
      .moveDown(0.2);

    doc.text(`Hôtel : ${hotel.name || '-'}`);
    doc.text(`Ville : ${hotel.city || '-'}`);
    doc.text(`Formule : ${request.relex?.formula || '-'}`);
    doc.text(`Type de chambre : ${request.relex?.roomType || '-'}`);
    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .text('PÉRIODE DU SÉJOUR', { underline: true })
      .moveDown(0.2);

    doc.text(
      `Du : ${
        request.relex?.finalStartDate
          ? new Date(request.relex.finalStartDate).toLocaleDateString('fr-DZ')
          : new Date(request.startDate).toLocaleDateString('fr-DZ')
      }`
    );
    doc.text(
      `Au : ${
        request.relex?.finalEndDate
          ? new Date(request.relex.finalEndDate).toLocaleDateString('fr-DZ')
          : new Date(request.endDate).toLocaleDateString('fr-DZ')
      }`
    );
    doc.text(`Nombre de nuits : ${nights}`);
    doc.moveDown(0.8);

    // ---- RÉCAP COÛT ----
    doc
      .fontSize(10)
      .text('RÉCAPITULATIF FINANCIER', { underline: true })
      .moveDown(0.2);

    doc.text(`Prix unitaire / nuit : ${pricePerNight.toLocaleString('fr-DZ')} DZD`);
    doc.text(
      `Total BC : ${total.toLocaleString('fr-DZ')} ${request.finance.currency || 'DZD'}`
    );
    doc.moveDown(0.8);

    // ---- OPTIONS & REMARQUES ----
    const opts = request.relex?.options || {};
    const optsList = [];
    if (opts.allowCancellation) optsList.push('Annulation possible');
    if (opts.allowHotelChange) optsList.push("Changement d'hôtel autorisé");
    if (opts.isLateReservation) optsList.push('Réservation tardive');
    if (opts.isPostStayEntry) optsList.push('Saisie post-hébergement');

    doc
      .fontSize(10)
      .text('OPTIONS / CONDITIONS', { underline: true })
      .moveDown(0.2);

    doc.text(`Options : ${optsList.length ? optsList.join(' · ') : '-'}`);
    doc.moveDown(0.2);
    doc.text(`Remarques Relex : ${request.relex?.comment || '-'}`);
    doc.moveDown(0.8);

    // ---- SIGNATURES ----
    doc
      .fontSize(10)
      .text('Visa Relex : ___________________________', { align: 'left' })
      .moveDown(2);
    doc.text('Visa Finance : _________________________', { align: 'left' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la génération du BC PDF' });
  }
});

module.exports = router;