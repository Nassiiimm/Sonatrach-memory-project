const mongoose = require('mongoose');

const factureSchema = new mongoose.Schema({
  // Référence hôtel
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },

  // Informations facture
  numeroFacture: { type: String, required: true },
  dateFacture: { type: Date, required: true },
  dateReception: { type: Date, default: Date.now },

  // Montant
  montant: { type: Number, required: true },
  devise: { type: String, enum: ['DZD', 'EUR', 'USD'], default: 'DZD' },

  // Réservations liées (optionnel)
  reservations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Request' }],

  // Période couverte par la facture
  periodeDebut: { type: Date },
  periodeFin: { type: Date },

  // Statut de traitement
  statut: {
    type: String,
    enum: ['EN_ATTENTE', 'VALIDEE', 'PAYEE', 'REJETEE'],
    default: 'EN_ATTENTE'
  },

  // Informations de paiement
  datePaiement: { type: Date },
  numeroBonPaiement: { type: String },

  // Suivi
  observations: { type: String },

  // Pièce jointe (scan de la facture)
  fichier: { type: String },

  // Utilisateur qui a saisi la facture
  saisieePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Utilisateur qui a validé/payé
  traiteePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true });

// Index pour recherches fréquentes
factureSchema.index({ hotel: 1, statut: 1 });
factureSchema.index({ statut: 1, createdAt: -1 });
factureSchema.index({ numeroFacture: 1 });

module.exports = mongoose.model('Facture', factureSchema);
