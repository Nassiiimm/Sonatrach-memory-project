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
        regionAcronym: 'ALG',
        password: 'admin123'
      },
      {
        matricule: '900001',
        name: 'Manager HMD',
        email: 'manager.hmd@sonatrach.dz',
        role: 'MANAGER',
        department: 'PRODUCTION',
        region: 'Hassi Messaoud',
        regionAcronym: 'HMD',
        password: 'manager123'
      },
      {
        matricule: '900002',
        name: 'Manager HRM',
        email: 'manager.hrm@sonatrach.dz',
        role: 'MANAGER',
        department: 'PRODUCTION',
        region: 'Hassi R\'Mel',
        regionAcronym: 'HRM',
        password: 'manager123'
      },
      {
        matricule: '900010',
        name: 'Agent Relex Siège',
        email: 'relex@sonatrach.dz',
        role: 'RELEX',
        department: 'RELEX',
        region: 'Siège Alger',
        regionAcronym: 'ALG',
        password: 'relex123'
      },
      {
        matricule: '900020',
        name: 'Contrôleur Finance',
        email: 'finance@sonatrach.dz',
        role: 'FINANCE',
        department: 'FINANCE',
        region: 'Siège Alger',
        regionAcronym: 'ALG',
        password: 'finance123'
      },
      {
        matricule: '100001',
        name: 'Ahmed Benali',
        email: 'ahmed.benali@sonatrach.dz',
        role: 'EMPLOYE',
        department: 'EXPLOITATION',
        region: 'Hassi Messaoud',
        regionAcronym: 'HMD',
        serviceImputation: 'EXP-HMD-01',
        password: 'employe123'
      },
      {
        matricule: '100002',
        name: 'Fatima Khaled',
        email: 'fatima.khaled@sonatrach.dz',
        role: 'EMPLOYE',
        department: 'MAINTENANCE',
        region: 'Hassi R\'Mel',
        regionAcronym: 'HRM',
        serviceImputation: 'MNT-HRM-02',
        password: 'employe123'
      }
    ];

    for (const d of defs) {
      let u = await User.findOne({ email: d.email });

      if (!u) {
        const { password, ...userData } = d;
        u = await User.create({
          ...userData,
          password: password
        });
        console.log('Créé :', d.email, '(', d.role, '-', d.regionAcronym, ')');
      } else {
        // Mettre a jour le mot de passe si l'utilisateur existe
        u.password = d.password;
        await u.save();
        console.log('Mot de passe mis à jour :', d.email);
      }
    }

    console.log('\n--- Comptes de démonstration ---');
    console.log('Admin     : admin@sonatrach.dz / admin123');
    console.log('Manager   : manager.hmd@sonatrach.dz / manager123');
    console.log('Manager   : manager.hrm@sonatrach.dz / manager123');
    console.log('Relex     : relex@sonatrach.dz / relex123');
    console.log('Finance   : finance@sonatrach.dz / finance123');
    console.log('Employé   : ahmed.benali@sonatrach.dz / employe123');
    console.log('Employé   : fatima.khaled@sonatrach.dz / employe123');

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
