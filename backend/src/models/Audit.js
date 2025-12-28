const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  action: String,
  entity: String,
  entityId: String,
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Audit', auditSchema);