// scripts/seed-regions.js

const mongoose = require('mongoose');
const Region = require('../src/models/Region');

// 👉 Charge les régions
const regions = [
  { code: 'ALG', name: 'Siège Division Production Alger', type: 'SIEGE' },

  { code: 'HMD', name: 'Hassi Messaoud', type: 'DIRECTION_REGIONALE' },
  { code: 'HRM', name: "Hassi R'Mel", type: 'DIRECTION_REGIONALE' },
  { code: 'HBK', name: 'Haoud Berkaoui', type: 'DIRECTION_REGIONALE' },
  { code: 'GTL', name: 'Gassi Touil', type: 'DIRECTION_REGIONALE' },
  { code: 'TFT', name: 'Tin Fouye Tabenkort', type: 'DIRECTION_REGIONALE' },
  { code: 'STH', name: 'Stah', type: 'DIRECTION_REGIONALE' },
  { code: 'OHT', name: 'Ohanet', type: 'DIRECTION_REGIONALE' },
  { code: 'INAS', name: 'In Amenas', type: 'DIRECTION_REGIONALE' },
  { code: 'RNS', name: 'Rhourd Nouss', type: 'DIRECTION_REGIONALE' },
  { code: 'REB', name: 'Rhourd El Baguel', type: 'DIRECTION_REGIONALE' },
  { code: 'ADR', name: 'Adrar', type: 'DIRECTION_REGIONALE' },

  { code: 'HAM', name: 'Hamra', type: 'DIRECTION' },
  { code: 'OWN', name: 'Oued Noumer', type: 'DIRECTION' }
];

// 👉 Charge la config d'environnement (URI Mongo)
require('dotenv').config({ path: './.env' });

(async () => {
  try {
    console.log('Connexion à MongoDB…');

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✔ Connecté.');

    console.log('Insertion / mise à jour des régions…');

    for (const r of regions) {
      await Region.findOneAndUpdate(
        { code: r.code }, // clé unique
        r,
        { upsert: true, new: true }
      );
    }

    console.log('✔ Régions insérées avec succès.');
  } catch (err) {
    console.error('❌ Erreur seed régions :', err);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnexion MongoDB.');
    process.exit();
  }
})();