const DecisionLog = require('../models/DecisionLog');

async function runDecisionEngine(userId, profile) {
  let isPermitted = true;
  let hasWarning = false;
  let warningMessage = '';
  let requiredAction = null;
  let expiresAt = null;

  if (profile.cognitiveLoad > 90) {
    hasWarning = true;
    warningMessage = 'Your Cognitive Load is extremely high. Starting Hard sessions may lead to burnout.';
    requiredAction = 'feature_lock';
    expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); 
  }

  let forcedReviewSubject = null;
  profile.subjectReadiness.forEach(s => {
    if (s.score < 40) {
      hasWarning = true;
      warningMessage = `Readiness for ${s.subject} has dropped below 40%. Recommend review.`;
      requiredAction = 'forced_review';
      forcedReviewSubject = s.subject;
    }
  });

  if (hasWarning) {
    await DecisionLog.create({
      user: userId,
      intent: 'system_cron',
      subject: forcedReviewSubject,
      isPermitted,
      mode: 'Strict',
      intervention: {
        hasWarning,
        warningMessage,
        requiredAction,
        expiresAt
      }
    });
  }

  return { isPermitted, intervention: { hasWarning, warningMessage, requiredAction, expiresAt } };
}

module.exports = { runDecisionEngine };
