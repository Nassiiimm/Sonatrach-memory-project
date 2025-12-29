// backend/scripts/seed-admin.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../src/models/User');

(async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/sonatrach_reservations'
    );

    const email = 'admin@sonatrach.dz';
    const matricule = '900000';

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        matricule,
        name: 'Admin Sonatrach',
        email,
        password: 'admin123',
        role: 'ADMIN',
        department: 'DSI',
        region: 'Siège Alger',
        regionAcronym: 'ALG'
      });
      console.log('Utilisateur admin créé :', email);
    } else {
      console.log('Admin déjà existant :', email);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
