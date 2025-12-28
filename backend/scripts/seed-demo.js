// backend/scripts/seed-demo.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../src/models/User');

(async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/sonatrach_reservations'
    );

    const defs = [
      {
        matricule: '900001',
        name: 'Manager Régional',
        email: 'manager@sonatrach.dz',
        role: 'MANAGER',
        department: 'PRODUCTION',
        region: 'HMD'
      },
      {
        matricule: '900002',
        name: 'Agent Relex',
        email: 'relex@sonatrach.dz',
        role: 'RELEX',
        department: 'RELEX',
        region: 'ALG'
      },
      {
        matricule: '900003',
        name: 'Contrôleur Finance',
        email: 'finance@sonatrach.dz',
        role: 'FINANCE',
        department: 'FINANCE',
        region: 'ALG'
      },
      {
        matricule: '900004',
        name: 'Employé Terrain',
        email: 'employe@sonatrach.dz',
        role: 'EMPLOYE',
        department: 'OPERATIONS',
        region: 'HMD'
      }
    ];

    for (const d of defs) {
      let u = await User.findOne({ email: d.email });

      if (!u) {
        u = await User.create({
          matricule: d.matricule,
          name: d.name,
          email: d.email,
          password: '123456',   // même mot de passe pour tous les comptes de démo
          role: d.role,
          department: d.department,
          region: d.region
        });
        console.log('Créé :', d.email, '(', d.role, ')');
      } else {
        console.log('Existe déjà :', d.email);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();