const StudySession = require('../models/StudySession');

async function runBehaviorEngine(userId, profile) {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const sessions = await StudySession.find({
    userId,
    date: { $gte: fourteenDaysAgo }
  })
    .select('durationMinutes')
    .lean();

  let totalMinutes = 0;
  sessions.forEach(s => totalMinutes += (s.durationMinutes || 0));
  
  const dailyAverageHours = totalMinutes / 60 / 14; 
  profile.momentumIndex = 1.0 + (dailyAverageHours * 0.1); 

  profile.consistencyScore = Math.min(100, profile.consistencyScore + 2); 
  
  return profile;
}

module.exports = { runBehaviorEngine };
