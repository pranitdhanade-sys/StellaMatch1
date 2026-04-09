const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
