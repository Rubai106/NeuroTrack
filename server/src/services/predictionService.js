const StudySession = require('../models/StudySession');
const WeaknessEntry = require('../models/WeaknessEntry');
const User = require('../models/User');
const mongoose = require('mongoose');

const predictExamReadiness = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);
  const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);

  const [user, sessions, weaknesses] = await Promise.all([
    User.findById(userId),
    StudySession.find({ userId: uid, date: { $gte: thirtyAgo } }),
    WeaknessEntry.find({ userId: uid }).lean()
  ]);

  if (!sessions.length) {
    return { readinessScore: 0, expectedGrade: 'N/A', breakdown: {}, suggestions: ['Start logging study sessions to get predictions'] };
  }

  // 1. Consistency (30%): streak + session frequency
  const streak = user?.currentStreak || 0;
  const consistencyScore = Math.min(100, streak * 5 + (sessions.length / 30) * 50);

  // 2. Study hours (25%): 60hrs in 30 days = 100%
  const totalHours = sessions.reduce((s, x) => s + x.durationMinutes, 0) / 60;
  const hoursScore = Math.min(100, (totalHours / 60) * 100);

  // 3. Weakness coverage (25%)
  const highWeakness = weaknesses.filter(w => {
    const er = w.totalAttempts > 0 ? w.wrongAttempts / w.totalAttempts : 0;
    return er * 60 + Math.max(0, 1 - w.studyWeightHours / 10) * 40 > 60;
  });
  const weaknessCoverage = Math.max(0, 100 - highWeakness.length * 15);

  // 4. Focus quality (20%)
  const avgFocus = sessions.reduce((s, x) => s + x.focusQuality, 0) / sessions.length;
  const focusScore = (avgFocus / 10) * 100;

  const readinessScore = Math.round(
    consistencyScore * 0.30 + hoursScore * 0.25 + weaknessCoverage * 0.25 + focusScore * 0.20
  );

  const grades = [
    { min: 85, grade: 'A+', label: 'Excellent' },
    { min: 75, grade: 'A',  label: 'Very Good' },
    { min: 65, grade: 'B+', label: 'Good' },
    { min: 55, grade: 'B',  label: 'Above Average' },
    { min: 45, grade: 'C',  label: 'Average' },
    { min: 0,  grade: 'D',  label: 'Needs Work' }
  ];
  const grade = grades.find(g => readinessScore >= g.min);

  const suggestions = [];
  if (consistencyScore < 50) suggestions.push('Study more consistently — aim for daily sessions');
  if (hoursScore < 50)       suggestions.push('Increase total study hours — try 2hrs/day minimum');
  if (highWeakness.length)   suggestions.push(`Address ${highWeakness.length} weak topic(s) urgently`);
  if (focusScore < 60)       suggestions.push('Improve focus quality — try the Pomodoro technique');

  let daysUntilExam = null;
  if (user?.examDate) daysUntilExam = Math.ceil((new Date(user.examDate) - new Date()) / 86400000);

  return {
    readinessScore,
    expectedGrade: grade.grade,
    gradeLabel: grade.label,
    breakdown: {
      consistency: Math.round(consistencyScore),
      studyHours: Math.round(hoursScore),
      weaknessCoverage: Math.round(weaknessCoverage),
      focusQuality: Math.round(focusScore)
    },
    suggestions,
    daysUntilExam,
    totalStudyHours: Math.round(totalHours * 10) / 10
  };
};

module.exports = { predictExamReadiness };
