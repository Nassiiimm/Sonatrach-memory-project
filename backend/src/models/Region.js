const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, 
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['SIEGE', 'DIRECTION_REGIONALE', 'DIRECTION'],
    default: 'DIRECTION_REGIONALE'
  }
}, { timestamps: true });

module.exports = mongoose.model('Region', regionSchema);