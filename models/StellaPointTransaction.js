const mongoose = require('mongoose');

const StellaPointTransactionSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, required: true, min: 1 },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StellaPointTransaction', StellaPointTransactionSchema);
