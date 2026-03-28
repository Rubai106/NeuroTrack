const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['daily', 'weekly', 'monthly', 'exam'], required: true },
  subject: { type: String, default: 'All' },
  targetMinutes: { type: Number, required: true },
  currentMinutes: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed', 'failed'], default: 'active' },
  isCompleted: { type: Boolean, default: false },
  examDate: { type: Date },
  examName: { type: String },
  period: { start: { type: Date, required: true }, end: { type: Date, required: true } },
  completedAt: { type: Date }
}, { timestamps: true });

goalSchema.virtual('progressPercent').get(function() {
  return Math.min(100, Math.round((this.currentMinutes / this.targetMinutes) * 100));
});
goalSchema.set('toJSON', { virtuals: true });
goalSchema.index({ userId: 1, status: 1, type: 1 });

module.exports = mongoose.model('Goal', goalSchema);
