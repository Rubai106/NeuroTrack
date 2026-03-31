async function runPredictionEngine(profile, sessionData) {
  const subject = sessionData.subject;
  if (!subject) return profile;

  let subjectConfig = profile.subjectReadiness.find(s => s.subject === subject);
  
  if (!subjectConfig) {
    subjectConfig = { subject, score: 90, mastery: 10, activity: 10, decayPenalty: 0, lastStudied: new Date() };
    profile.subjectReadiness.push(subjectConfig);
  } else {
    subjectConfig.decayPenalty = 0;
    subjectConfig.activity += 5;
    subjectConfig.mastery = Math.min(100, subjectConfig.mastery + 2);
    subjectConfig.score = Math.min(100, subjectConfig.mastery * 0.7 + subjectConfig.activity * 0.3);
    subjectConfig.lastStudied = new Date();
  }

  profile.subjectReadiness.forEach(s => {
    if (s.subject !== subject) {
       s.decayPenalty += 1; 
       s.score = Math.max(0, s.score - 1);
    }
  });

  return profile;
}

module.exports = { runPredictionEngine };
