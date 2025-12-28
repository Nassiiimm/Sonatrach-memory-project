const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, default: 'Algérie' },
  code: { type: String }, // code interne / contrat

  // Tarifs existants
  prices: {
    simple: { type: Number, default: 0 },
    demi_pension: { type: Number, default: 0 },
    pension_complete: { type: Number, default: 0 },
    formule_repas: { type: Number, default: 0 }
  },

  // 🔥 NOUVEAU : types de chambres
  roomTypes: [{
    label: String,       // "Single", "Double", "Suite"
    code: String,        // interne
    basePrice: Number    // prix/nuit
  }],

  provider: { type: String }, 
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);