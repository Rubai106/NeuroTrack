const { asyncWrapper } = require('../middleware/errorHandler');
const { BADGES, LEVELS, getLevelFromXP } = require('../services/gamificationService');
const User = require('../models/User');
const StudySession = require('../models/StudySession');

const getGamification = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.user._id);
  const level = user.level;
  const xpForNext = LEVELS[level] || LEVELS[LEVELS.length - 1];
  const xpForCurrent = LEVELS[level - 1] || 0;

  const agg = await StudySession.aggregate([
    { $match: { userId: user._id } },
    { $group: { _id: null, totalMins: { $sum: '$durationMinutes' }, sessions: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    data: {
      xp: user.xp, level, xpForNext, xpForCurrent,
      xpProgress: Math.round(((user.xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100),
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      badges: user.badges,
      allBadges: BADGES,
      totalSessions: agg[0]?.sessions || 0,
      totalHours: Math.round((agg[0]?.totalMins || 0) / 60 * 10) / 10
    }
  });
});

module.exports = { getGamification };
