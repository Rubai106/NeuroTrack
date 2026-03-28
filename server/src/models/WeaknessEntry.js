const mongoose = require('mongoose');

const weaknessEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  totalAttempts: { type: Number, default: 0 },
  wrongAttempts: { type: Number, default: 0 },
  studyWeightHours: { type: Number, default: 0 },
  lastTestedDate: { type: Date },
  confidenceScore: { type: Number, default: 50 },
  quizResults: [{
    date: { type: Date, default: Date.now },
    score: Number,
    totalQuestions: Number,
    timeTakenMinutes: Number
  }]
}, { timestamps: true });

weaknessEntrySchema.virtual('weaknessScore').get(function() {
  if (this.totalAttempts === 0) return Math.round(Math.max(0, 1 - this.studyWeightHours / 10) * 40);
  const errorRate = this.wrongAttempts / this.totalAttempts;
  const studyPenalty = Math.max(0, 1 - this.studyWeightHours / 10);
  return Math.round(Math.min(100, errorRate * 60 + studyPenalty * 40));
});

weaknessEntrySchema.set('toJSON', { virtuals: true });
weaknessEntrySchema.index({ userId: 1, subject: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model('WeaknessEntry', weaknessEntrySchema);
