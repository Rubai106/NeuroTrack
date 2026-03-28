const User = require('../models/User');
const StudySession = require('../models/StudySession');
const Note = require('../models/Note');
const Goal = require('../models/Goal');

const XP = { sessionCompleted: 20, pomodoroCompleted: 10, goalAchieved: 50, streakDay: 15, quizCompleted: 25, noteAdded: 5 };
const LEVELS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700, 7500];
const BADGES = [
  { id: 'first_session', name: 'First Step', description: 'Logged your first study session', icon: '🎯' },
  { id: 'streak_3',  name: 'Getting Started',  description: '3-day study streak',  icon: '🌱' },
  { id: 'streak_7',  name: 'Week Warrior',      description: '7-day study streak',  icon: '🔥' },
  { id: 'streak_30', name: 'Iron Discipline',   description: '30-day study streak', icon: '⚡' },
  { id: 'hours_10',  name: 'Dedicated',         description: 'Studied 10+ hours total', icon: '📚' },
  { id: 'hours_50',  name: 'Scholar',           description: 'Studied 50+ hours total', icon: '🎓' },
  { id: 'pomodoro_10', name: 'Tomato Master',   description: 'Completed 10 Pomodoros', icon: '🍅' },
  { id: 'goal_5',    name: 'Goal Getter',       description: 'Completed 5 goals', icon: '✅' },
  { id: 'notes_10',  name: 'Knowledge Base',    description: 'Created 10 notes', icon: '📝' },
  { id: 'deep_work', name: 'Deep Worker',       description: 'Completed a 90+ min session', icon: '🧠' },
];

const getLevelFromXP = (xp) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) if (xp >= LEVELS[i]) return i + 1;
  return 1;
};

const awardXP = async (userId, action, count = 1) => {
  const earned = (XP[action] || 0) * count;
  if (!earned) return null;
  const user = await User.findById(userId);
  if (!user) return null;
  user.xp += earned;
  user.level = getLevelFromXP(user.xp);
  await user.save();
  return { earned, total: user.xp, level: user.level };
};

const checkAndAwardBadges = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return [];
  const earned = user.badges.map(b => b.id);
  const newBadges = [];

  const [sessionCount, noteCount, completedGoals, agg, pomAgg, deepWork] = await Promise.all([
    StudySession.countDocuments({ userId }),
    Note.countDocuments({ userId }),
    Goal.countDocuments({ userId, isCompleted: true }),
    StudySession.aggregate([{ $match: { userId: user._id } }, { $group: { _id: null, mins: { $sum: '$durationMinutes' }, pomos: { $sum: '$pomodoroCount' } } }]),
    StudySession.countDocuments({ userId, pomodoroCount: { $gt: 0 } }),
    StudySession.countDocuments({ userId, durationMinutes: { $gte: 90 } })
  ]);

  const totalMins = agg[0]?.mins || 0;
  const totalPomos = agg[0]?.pomos || 0;

  const checks = [
    { id: 'first_session', cond: sessionCount >= 1 },
    { id: 'streak_3',      cond: user.currentStreak >= 3 },
    { id: 'streak_7',      cond: user.currentStreak >= 7 },
    { id: 'streak_30',     cond: user.currentStreak >= 30 },
    { id: 'hours_10',      cond: totalMins >= 600 },
    { id: 'hours_50',      cond: totalMins >= 3000 },
    { id: 'pomodoro_10',   cond: totalPomos >= 10 },
    { id: 'goal_5',        cond: completedGoals >= 5 },
    { id: 'notes_10',      cond: noteCount >= 10 },
    { id: 'deep_work',     cond: deepWork >= 1 },
  ];

  for (const c of checks) {
    if (c.cond && !earned.includes(c.id)) {
      const badge = BADGES.find(b => b.id === c.id);
      if (badge) { user.badges.push({ ...badge, earnedAt: new Date() }); newBadges.push(badge); }
    }
  }

  if (newBadges.length) await user.save();
  return newBadges;
};

const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return 0;
  const today = new Date(); today.setHours(0,0,0,0);

  if (!user.lastStudyDate) {
    user.currentStreak = 1;
  } else {
    const last = new Date(user.lastStudyDate); last.setHours(0,0,0,0);
    const diff = Math.round((today - last) / 86400000);
    if (diff === 1) user.currentStreak += 1;
    else if (diff > 1) user.currentStreak = 1;
  }
  user.lastStudyDate = today;
  user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
  await user.save();
  await awardXP(userId, 'streakDay');
  return user.currentStreak;
};

module.exports = { awardXP, checkAndAwardBadges, updateStreak, getLevelFromXP, BADGES, LEVELS };
