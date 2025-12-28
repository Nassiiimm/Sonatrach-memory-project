const mongoose = require('mongoose');
const STATUS = require('../constants/status');

const requestSchema = new mongoose.Schema({
  // Employé principal
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // 🔹 Réservation groupée
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // 🔹 Suggestion employé
  suggestedHotel: {
    name: String,
    city: String,
    notes: String
  },

  // Données de la demande
  destination: { type: String, required: true },
  city: { type: String },
  country: { type: String, default: 'Algérie' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  motif: { type: String },
  extraRequests: { type: String },

  // Statut workflow
  status: {
    type: String,
    enum: Object.values(STATUS),
    default: STATUS.EN_ATTENTE_MANAGER
  },

  // Fichiers
  attachments: [String],

  // Décision Manager
  managerDecision: {
    approved: Boolean,
    comment: String,
    at: Date
  },

  // ------------- RELEX --------------
  relex: {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    formula: { type: String },

    roomType: { type: String },  // SINGLE / DOUBLE / SUITE

    finalStartDate: Date,
    finalEndDate: Date,

    comment: String,

    // 🔥 Toutes les nouvelles options
    options: {
      allowCancellation: { type: Boolean, default: false },
      allowHotelChange: { type: Boolean, default: false },
      isLateReservation: { type: Boolean, default: false },
      isPostStayEntry: { type: Boolean, default: false }
    }
  },

  // ------------- FINANCE / BC --------------
  finance: {
    nights: Number,
    pricePerNight: Number,
    total: Number,
    currency: { type: String, default: 'DZD' },

    poNumber: String,
    poFile: String,
    validatedAt: Date,

    paymentStatus: {
      type: String,
      enum: ['NON_PAYE','PAYE'],
      default: 'NON_PAYE'
    },
    paymentDate: Date,

    // 🔹 Snapshot employé pour le BC
    employeeSnapshot: {
      matricule: String,
      name: String,
      regionAcronym: String,
      serviceImputation: String
    },

    // 🔹 Si réservation groupée
    participantsCount: Number
  }

}, { timestamps: true });

requestSchema.index({ status: 1, createdAt: -1 });
requestSchema.index({ employee: 1, createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);