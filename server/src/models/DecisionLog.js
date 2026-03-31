const mongoose = require('mongoose');

const decisionLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  intent: { type: String }, // e.g., 'start_session', 'system_cron'
  subject: { type: String },
  isPermitted: { type: Boolean, default: true },
  mode: { type: String, default: 'AssistMode', enum: ['AssistMode', 'Strict'] },
  intervention: {
    hasWarning: { type: Boolean, default: false },
    warningMessage: { type: String, default: '' },
    requiredAction: { type: String, default: null }, // e.g., 'forced_review', 'feature_lock'
    expiresAt: { type: Date, default: null }
  }
}, { timestamps: true });

module.exports = mongoose.model('DecisionLog', decisionLogSchema);
