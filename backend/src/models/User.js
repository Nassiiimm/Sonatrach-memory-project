const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Identité interne
  matricule: { type: String, required: true, unique: true },  // Mat
  firstName: { type: String, required: false },               // Prénom
  lastName: { type: String, required: false },                // Nom
  name: { type: String, required: true },                     // utilisé pour l'affichage

  // Coordonnées
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // Organisation
  regionAcronym: { type: String },        // HMD, HRM, OHT…
  serviceImputation: { type: String },    // service / unité
  department: { type: String },
  region: { type: String },               // peut être l’acronyme ou le nom

  // Rôle RH
  role: { 
    type: String, 
    enum: ['EMPLOYE','MANAGER','RELEX','FINANCE','ADMIN'], 
    default: 'EMPLOYE' 
  },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Génération du champ "name" si absent
userSchema.pre('save', async function(next){
  if (!this.name && this.firstName && this.lastName) {
    this.name = `${this.firstName} ${this.lastName}`;
  }

  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

userSchema.methods.comparePassword = async function(candidate){
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);