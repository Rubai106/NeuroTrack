const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  preferences: {
    pomodoroWork: { type: Number, default: 25 },
    pomodoroBreak: { type: Number, default: 5 },
    dailyGoalMinutes: { type: Number, default: 120 },
    theme: { type: String, default: 'light' }
  },
  subjects: [{ name: String, color: { type: String, default: '#4CAF50' } }],
  // Gamification
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ id: String, name: String, description: String, icon: String, earnedAt: Date }],
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastStudyDate: { type: Date },
  examDate: { type: Date },
  examName: { type: String, default: '' },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function(pw) {
  return bcrypt.compare(pw, this.password);
};

module.exports = mongoose.model('User', userSchema);
