const { asyncWrapper } = require('../middleware/errorHandler');
const BehaviorProfile = require('../models/BehaviorProfile');
const { runDecisionEngine } = require('../engines/decisionEngine');

const getBehaviorProfile = asyncWrapper(async (req, res) => {
  let profile = await BehaviorProfile.findOne({ user: req.user._id }).lean();

  if (!profile) profile = await BehaviorProfile.create({ user: req.user._id });
  
  res.json({
    status: 'success',
    data: {
      metrics: {
        momentumIndex: profile.momentumIndex,
        consistencyScore: profile.consistencyScore,
        cognitiveLoad: profile.cognitiveLoad
      },
      currentState: profile.currentState,
      recentInterventions: profile.recentInterventions
    }
  });
});

const getReadiness = asyncWrapper(async (req, res) => {
  const profile = await BehaviorProfile.findOne({ user: req.user._id }).lean();

  const subject = req.params.subject;
  let readinessScore = 0;
  let components = { mastery: 0, activity: 0, decayPenalty: 0 };
  
  if (profile) {
    const s = profile.subjectReadiness.find(sub => sub.subject === subject);
    if (s) {
      readinessScore = s.score;
      components = { mastery: s.mastery, activity: s.activity, decayPenalty: s.decayPenalty };
    }
  }

  res.json({
    status: 'success',
    data: {
      subject,
      readinessScore,
      components,
      nextRecommendedReview: new Date(Date.now() + 86400000) 
    }
  });
});

const getDailyBrief = asyncWrapper(async (req, res) => {
  const profile = await BehaviorProfile.findOne({ user: req.user._id }).lean();

  res.json({
    status: 'success',
    data: {
      date: new Date().toISOString().split('T')[0],
      summary: {
        state: profile ? `Current state is ${profile.currentState} (Load: ${Math.round(profile.cognitiveLoad)}%).` : 'No data yet.',
        risks: profile && profile.cognitiveLoad > 80 ? ['High risk of burnout detected.'] : [],
        focusRecommendation: 'Focus on your weakest subject to build consistency.'
      },
      priorityTasks: ['review_recent_topics']
    }
  });
});

const evaluateDecision = asyncWrapper(async (req, res) => {
  let profile = await BehaviorProfile.findOne({ user: req.user._id });
  if (!profile) profile = new BehaviorProfile({ user: req.user._id });
  
  const decisionResult = await runDecisionEngine(req.user._id, profile);
  
  res.json({
    status: 'success',
    data: decisionResult
  });
});

module.exports = { getBehaviorProfile, getReadiness, getDailyBrief, evaluateDecision };
