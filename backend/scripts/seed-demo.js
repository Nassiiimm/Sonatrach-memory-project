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
        matricule: '900000',
        name: 'Admin Sonatrach',
        email: 'admin@sonatrach.dz',
        role: 'ADMIN',
        department: 'DSI',
        region: 'Siège Alger',
        regionAcronym: 'ALG'
      },
      {
        matricule: '900001',
        name: 'Manager HMD',
        email: 'manager.hmd@sonatrach.dz',
        role: 'MANAGER',
        department: 'PRODUCTION',
        region: 'Hassi Messaoud',
        regionAcronym: 'HMD'
      },
      {
        matricule: '900002',
        name: 'Manager HRM',
        email: 'manager.hrm@sonatrach.dz',
        role: 'MANAGER',
        department: 'PRODUCTION',
        region: 'Hassi R\'Mel',
        regionAcronym: 'HRM'
      },
      {
        matricule: '900010',
        name: 'Agent Relex Siège',
        email: 'relex@sonatrach.dz',
        role: 'RELEX',
        department: 'RELEX',
        region: 'Siège Alger',
        regionAcronym: 'ALG'
      },
      {
        matricule: '900020',
        name: 'Contrôleur Finance',
        email: 'finance@sonatrach.dz',
        role: 'FINANCE',
        department: 'FINANCE',
        region: 'Siège Alger',
        regionAcronym: 'ALG'
      },
      {
        matricule: '100001',
        name: 'Ahmed Benali',
        email: 'ahmed.benali@sonatrach.dz',
        role: 'EMPLOYE',
        department: 'EXPLOITATION',
        region: 'Hassi Messaoud',
        regionAcronym: 'HMD',
        serviceImputation: 'EXP-HMD-01'
      },
      {
        matricule: '100002',
        name: 'Fatima Khaled',
        email: 'fatima.khaled@sonatrach.dz',
        role: 'EMPLOYE',
        department: 'MAINTENANCE',
        region: 'Hassi R\'Mel',
        regionAcronym: 'HRM',
        serviceImputation: 'MNT-HRM-02'
      }
    ];

    for (const d of defs) {
      let u = await User.findOne({ email: d.email });

      if (!u) {
        u = await User.create({
          ...d,
          password: 'Demo@2024'  // Mot de passe sécurisé pour démo
        });
        console.log('Créé :', d.email, '(', d.role, '-', d.regionAcronym, ')');
      } else {
        console.log('Existe déjà :', d.email);
      }
    }

    console.log('\n--- Comptes de démonstration ---');
    console.log('Mot de passe commun : Demo@2024');
    console.log('Admin     : admin@sonatrach.dz');
    console.log('Manager   : manager.hmd@sonatrach.dz (région HMD)');
    console.log('Manager   : manager.hrm@sonatrach.dz (région HRM)');
    console.log('Relex     : relex@sonatrach.dz');
    console.log('Finance   : finance@sonatrach.dz');
    console.log('Employé   : ahmed.benali@sonatrach.dz (région HMD)');
    console.log('Employé   : fatima.khaled@sonatrach.dz (région HRM)');

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
