const mongoose = require('mongoose');

const FriendRequestSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
  },
  { timestamps: true }
);

FriendRequestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

module.exports = mongoose.model('FriendRequest', FriendRequestSchema);
