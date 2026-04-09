const mongoose = require('mongoose');

const FriendMessageSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FriendMessage', FriendMessageSchema);
