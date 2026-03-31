const mongoose = require('mongoose');

const behaviorProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  momentumIndex: { type: Number, default: 1.0 }, // velocity of study hours
  consistencyScore: { type: Number, default: 100 }, // out of 100
  cognitiveLoad: { type: Number, default: 0 }, // 0 to 100
  currentState: { 
    type: String, 
    enum: ['DeepFocus', 'BurnoutPhase', 'Recovery', 'Distracted'], 
    default: 'DeepFocus' 
  },
  recentInterventions: { type: Number, default: 0 },
  subjectReadiness: [{
    subject: String,
    score: { type: Number, default: 100 },
    mastery: { type: Number, default: 0 },
    activity: { type: Number, default: 0 },
    decayPenalty: { type: Number, default: 0 },
    lastStudied: { type: Date }
  }]
}, { timestamps: true });

module.exports = mongoose.model('BehaviorProfile', behaviorProfileSchema);
