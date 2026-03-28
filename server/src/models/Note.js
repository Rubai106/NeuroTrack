const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  subject: { type: String, required: true, trim: true },
  topic: { type: String, default: '' },
  tags: [{ type: String, trim: true }],
  isPinned: { type: Boolean, default: false },
  color: { type: String, default: '#ffffff' }
}, { timestamps: true });

noteSchema.index({ title: 'text', content: 'text', tags: 'text' });
noteSchema.index({ userId: 1, subject: 1 });

module.exports = mongoose.model('Note', noteSchema);
