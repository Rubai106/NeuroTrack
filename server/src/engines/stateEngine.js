async function runStateEngine(profile, sessionData) {
  let loadIncrease = (sessionData.durationMinutes || 0) / 10;
  
  if (sessionData.interruptionCount > 0) {
    loadIncrease += (sessionData.interruptionCount * 2);
  }

  loadIncrease = loadIncrease / profile.momentumIndex;
  
  profile.cognitiveLoad = Math.min(100, (profile.cognitiveLoad || 0) + loadIncrease);

  if (profile.cognitiveLoad > 85) {
    profile.currentState = 'BurnoutPhase';
  } else if (profile.cognitiveLoad < 30) {
    profile.currentState = 'Recovery';
  } else {
    profile.currentState = 'DeepFocus';
  }

  return profile;
}

module.exports = { runStateEngine };
