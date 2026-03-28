const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true, trim: true },
  topic: { type: String, default: 'General', trim: true },
  durationMinutes: { type: Number, required: true, min: 1 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  focusQuality: { type: Number, min: 1, max: 10, default: 7 },
  energyLevel: { type: Number, min: 1, max: 5, default: 3 },
  distractionMinutes: { type: Number, default: 0 },
  sessionType: { type: String, enum: ['pomodoro', 'manual', 'deep-work', 'review'], default: 'manual' },
  pomodoroCount: { type: Number, default: 0 },
  notes: { type: String, trim: true, default: '' },
  mood: { type: String, enum: ['great', 'good', 'okay', 'tired', 'stressed'], default: 'good' },
  tags: [{ type: String, trim: true }],
  completedAt: { type: Date, default: Date.now },
  date: { type: Date, default: Date.now, index: true },
  productivityScore: { type: Number, min: 0, max: 100 }
}, { timestamps: true });

studySessionSchema.pre('save', function(next) {
  const distractionRate = Math.min(this.distractionMinutes / Math.max(this.durationMinutes, 1), 1);
  this.productivityScore = Math.round((this.focusQuality / 10) * (1 - distractionRate) * 100);
  next();
});

studySessionSchema.index({ userId: 1, date: -1 });
studySessionSchema.index({ userId: 1, subject: 1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
