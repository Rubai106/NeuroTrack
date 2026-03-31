const { runBehaviorEngine } = require('./behaviorEngine');
const { runStateEngine } = require('./stateEngine');
const { runPredictionEngine } = require('./predictionEngine');
const { runDecisionEngine } = require('./decisionEngine');
const BehaviorProfile = require('../models/BehaviorProfile');

async function dispatchEnginePipeline(userId, sessionData) {
  let profile = await BehaviorProfile.findOne({ user: userId });
  if (!profile) {
    profile = new BehaviorProfile({ user: userId });
  }

  profile = await runBehaviorEngine(userId, profile);
  profile = await runStateEngine(profile, sessionData);
  profile = await runPredictionEngine(profile, sessionData);

  await profile.save();

  const decisionObj = await runDecisionEngine(userId, profile);

  return {
    profile,
    decision: decisionObj
  };
}

module.exports = { dispatchEnginePipeline };
