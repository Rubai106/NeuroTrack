const StudySession = require('../models/StudySession');
const User = require('../models/User');
const { updateStudyWeight } = require('../services/weaknessService');
const { awardXP, checkAndAwardBadges, updateStreak } = require('../services/gamificationService');
const { AppError, asyncWrapper } = require('../middleware/errorHandler');
const { dispatchEnginePipeline } = require('../engines/engineDispatcher');

const getSessions = asyncWrapper(async (req, res) => {
  const { limit = 20, page = 1, subject, startDate, endDate } = req.query;
  const query = { userId: req.user._id };
  if (subject) query.subject = subject;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  const sessions = await StudySession.find(query)
    .sort({ completedAt: -1 })
    .limit(+limit).skip((+page - 1) * +limit);
  const total = await StudySession.countDocuments(query);
  res.json({ success: true, data: sessions, total, page: +page });
});

const getTodaySessions = asyncWrapper(async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const sessions = await StudySession.find({
    userId: req.user._id,
    completedAt: { $gte: today, $lt: tomorrow }
  }).sort({ completedAt: -1 });
  res.json({ success: true, data: sessions });
});

const createSession = asyncWrapper(async (req, res) => {
  const session = await StudySession.create({ ...req.body, userId: req.user._id });

  // Side effects
  await updateStudyWeight(req.user._id, session.subject, session.topic, session.durationMinutes);
  const xpResult = await awardXP(req.user._id, 'sessionCompleted');
  if (session.sessionType === 'pomodoro' && session.pomodoroCount > 0) {
    await awardXP(req.user._id, 'pomodoroCompleted', session.pomodoroCount);
  }
  await updateStreak(req.user._id);
  const newBadges = await checkAndAwardBadges(req.user._id);

  // Run the Cognitive Engine Pipeline
  const engineResult = await dispatchEnginePipeline(req.user._id, {
    subject: session.subject,
    durationMinutes: session.durationMinutes,
    interruptionCount: req.body.interruptionCount || 0
  });

  res.status(201).json({ 
    success: true, 
    data: session, 
    xpResult, 
    newBadges,
    engineProfile: engineResult.profile,
    engineDecision: engineResult.decision
  });
});

const updateSession = asyncWrapper(async (req, res) => {
  const session = await StudySession.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body, { new: true }
  );
  if (!session) throw new AppError('Session not found', 404);
  res.json({ success: true, data: session });
});

const deleteSession = asyncWrapper(async (req, res) => {
  const session = await StudySession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!session) throw new AppError('Session not found', 404);
  res.json({ success: true, message: 'Session deleted' });
});

module.exports = { getSessions, createSession, updateSession, deleteSession, getTodaySessions };
