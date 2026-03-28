const WeaknessEntry = require('../models/WeaknessEntry');

const recordQuizResult = async (userId, { subject, topic, score, totalQuestions, timeTakenMinutes }) => {
  let entry = await WeaknessEntry.findOne({ userId, subject, topic });
  if (!entry) entry = new WeaknessEntry({ userId, subject, topic });

  const wrongAnswers = totalQuestions - score;
  entry.totalAttempts += totalQuestions;
  entry.wrongAttempts += wrongAnswers;
  entry.lastTestedDate = new Date();

  const percentage = (score / totalQuestions) * 100;
  if (percentage >= 70) entry.confidenceScore = Math.min(100, entry.confidenceScore + 10);
  else if (percentage < 50) entry.confidenceScore = Math.max(0, entry.confidenceScore - 15);

  entry.quizResults.push({ score, totalQuestions, timeTakenMinutes });
  await entry.save();
  return entry;
};

const updateStudyWeight = async (userId, subject, topic, durationMinutes) => {
  const entry = await WeaknessEntry.findOne({ userId, subject, topic });
  if (entry) {
    entry.studyWeightHours += durationMinutes / 60;
    await entry.save();
  }
};

const getRankedWeaknesses = async (userId) => {
  const entries = await WeaknessEntry.find({ userId }).lean();
  return entries.map(e => {
    const errorRate = e.totalAttempts > 0 ? e.wrongAttempts / e.totalAttempts : 0;
    const studyPenalty = Math.max(0, 1 - e.studyWeightHours / 10);
    return { ...e, weaknessScore: Math.round(Math.min(100, errorRate * 60 + studyPenalty * 40)) };
  }).sort((a, b) => b.weaknessScore - a.weaknessScore);
};

module.exports = { recordQuizResult, updateStudyWeight, getRankedWeaknesses };
