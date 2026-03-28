const StudySession = require('../models/StudySession');
const mongoose = require('mongoose');

const toObjId = (id) => new mongoose.Types.ObjectId(id);

const getStudyHoursByRange = async (userId, days = 30) => {
  const start = new Date(); start.setDate(start.getDate() - days); start.setHours(0,0,0,0);
  return StudySession.aggregate([
    { $match: { userId: toObjId(userId), date: { $gte: start } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
      totalMinutes: { $sum: '$durationMinutes' },
      avgFocus: { $avg: '$focusQuality' },
      sessions: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ]);
};

const getSubjectDistribution = async (userId, days = 30) => {
  const start = new Date(); start.setDate(start.getDate() - days); start.setHours(0,0,0,0);
  return StudySession.aggregate([
    { $match: { userId: toObjId(userId), date: { $gte: start } } },
    { $group: { _id: '$subject', totalMinutes: { $sum: '$durationMinutes' }, sessions: { $sum: 1 } } },
    { $sort: { totalMinutes: -1 } }
  ]);
};

const getBestStudyTime = async (userId) => {
  const result = await StudySession.aggregate([
    { $match: { userId: toObjId(userId) } },
    { $group: {
      _id: { $hour: '$date' },
      avgFocus: { $avg: '$focusQuality' },
      totalMinutes: { $sum: '$durationMinutes' },
      count: { $sum: 1 }
    }},
    { $sort: { avgFocus: -1 } },
    { $limit: 3 }
  ]);
  const label = (h) => h>=5&&h<12?'Morning':h>=12&&h<17?'Afternoon':h>=17&&h<21?'Evening':'Night';
  return result.map(r => ({ ...r, label: label(r._id) }));
};

const detectBurnout = async (userId) => {
  const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7);
  const daily = await StudySession.aggregate([
    { $match: { userId: toObjId(userId), date: { $gte: sevenAgo } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
      avgFocus: { $avg: '$focusQuality' },
      totalMinutes: { $sum: '$durationMinutes' }
    }},
    { $sort: { _id: 1 } }
  ]);
  if (daily.length < 3) return { detected: false };
  let declining = 0;
  for (let i = 1; i < daily.length; i++) {
    if (daily[i].avgFocus < daily[i-1].avgFocus) declining++;
  }
  return { detected: declining >= 3, days: declining, data: daily };
};

const getHeatmapData = async (userId) => {
  const yearAgo = new Date(); yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  return StudySession.aggregate([
    { $match: { userId: toObjId(userId), date: { $gte: yearAgo } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
      totalMinutes: { $sum: '$durationMinutes' },
      sessions: { $sum: 1 }
    }}
  ]);
};

const getDashboardStats = async (userId) => {
  const uid = toObjId(userId);
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0,0,0,0);
  const monthStart = new Date(); monthStart.setDate(monthStart.getDate() - 30); monthStart.setHours(0,0,0,0);

  const [todayStats, weekStats, monthStats, recentSessions] = await Promise.all([
    StudySession.aggregate([
      { $match: { userId: uid, date: { $gte: todayStart } } },
      { $group: { _id: null, mins: { $sum: '$durationMinutes' }, sessions: { $sum: 1 }, avgFocus: { $avg: '$focusQuality' } } }
    ]),
    StudySession.aggregate([
      { $match: { userId: uid, date: { $gte: weekStart } } },
      { $group: { _id: null, mins: { $sum: '$durationMinutes' }, sessions: { $sum: 1 }, avgFocus: { $avg: '$focusQuality' } } }
    ]),
    StudySession.aggregate([
      { $match: { userId: uid, date: { $gte: monthStart } } },
      { $group: { _id: null, mins: { $sum: '$durationMinutes' }, sessions: { $sum: 1 } } }
    ]),
    StudySession.find({ userId: uid }).sort({ date: -1 }).limit(5)
  ]);

  return {
    today: todayStats[0] || { mins: 0, sessions: 0, avgFocus: 0 },
    week: weekStats[0] || { mins: 0, sessions: 0, avgFocus: 0 },
    month: monthStats[0] || { mins: 0, sessions: 0 },
    recentSessions
  };
};

module.exports = { getStudyHoursByRange, getSubjectDistribution, getBestStudyTime, detectBurnout, getHeatmapData, getDashboardStats };
