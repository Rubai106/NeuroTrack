const WeaknessEntry = require('../models/WeaknessEntry');
const { AppError, asyncWrapper } = require('../middleware/errorHandler');
const { recordQuizResult, getRankedWeaknesses } = require('../services/weaknessService');
const { awardXP } = require('../services/gamificationService');

const getWeaknesses = asyncWrapper(async (req, res) => {
  const data = await getRankedWeaknesses(req.user._id);
  res.json({ success: true, data });
});

const addQuizResult = asyncWrapper(async (req, res) => {
  const entry = await recordQuizResult(req.user._id, req.body);
  await awardXP(req.user._id, 'quizCompleted');
  res.status(201).json({ success: true, data: entry });
});

const deleteEntry = asyncWrapper(async (req, res) => {
  await WeaknessEntry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true, message: 'Entry deleted' });
});

module.exports = { getWeaknesses, addQuizResult, deleteEntry };
