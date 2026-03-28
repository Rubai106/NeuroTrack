const Goal = require('../models/Goal');
const { AppError, asyncWrapper } = require('../middleware/errorHandler');
const { awardXP } = require('../services/gamificationService');

const getGoals = asyncWrapper(async (req, res) => {
  const { status, type } = req.query;
  const query = { userId: req.user._id };
  if (status) query.status = status;
  if (type) query.type = type;
  const goals = await Goal.find(query).sort({ createdAt: -1 });
  res.json({ success: true, data: goals });
});

const createGoal = asyncWrapper(async (req, res) => {
  const { title, type, subject, targetMinutes, examDate, examName } = req.body;
  if (!title || !type || !targetMinutes) throw new AppError('title, type and targetMinutes required', 400);

  const now = new Date();
  let periodEnd = new Date();
  if (type === 'daily')   periodEnd.setDate(now.getDate() + 1);
  else if (type === 'weekly')  periodEnd.setDate(now.getDate() + 7);
  else if (type === 'monthly') periodEnd.setDate(now.getDate() + 30);
  else if (type === 'exam' && examDate) periodEnd = new Date(examDate);

  const goal = await Goal.create({
    userId: req.user._id, title, type, subject, targetMinutes,
    examDate, examName, period: { start: now, end: periodEnd }
  });
  res.status(201).json({ success: true, data: goal });
});

const updateGoal = asyncWrapper(async (req, res) => {
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body, { new: true }
  );
  if (!goal) throw new AppError('Goal not found', 404);
  res.json({ success: true, data: goal });
});

const updateProgress = asyncWrapper(async (req, res) => {
  const { minutes } = req.body;
  const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!goal) throw new AppError('Goal not found', 404);

  goal.currentMinutes = (goal.currentMinutes || 0) + (minutes || 0);
  if (goal.currentMinutes >= goal.targetMinutes && !goal.isCompleted) {
    goal.isCompleted = true;
    goal.status = 'completed';
    goal.completedAt = new Date();
    await awardXP(req.user._id, 'goalAchieved');
  }
  await goal.save();
  res.json({ success: true, data: goal });
});

const deleteGoal = asyncWrapper(async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!goal) throw new AppError('Goal not found', 404);
  res.json({ success: true, message: 'Goal deleted' });
});

module.exports = { getGoals, createGoal, updateGoal, deleteGoal, updateProgress };
