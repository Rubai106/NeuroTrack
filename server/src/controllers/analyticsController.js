const { asyncWrapper } = require('../middleware/errorHandler');
const { getDashboardStats, getStudyHoursByRange, getSubjectDistribution, getHeatmapData, getBestStudyTime, detectBurnout } = require('../services/analyticsService');
const { generateInsights, generateDailyBrief, getReviewQueue } = require('../services/insightsService');

const getDashboard = asyncWrapper(async (req, res) => {
  const data = await getDashboardStats(req.user._id);
  res.json({ success: true, data });
});

const getChartData = asyncWrapper(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const [hours, subjects] = await Promise.all([
    getStudyHoursByRange(req.user._id, days),
    getSubjectDistribution(req.user._id, days)
  ]);
  res.json({ success: true, data: { hours, subjects } });
});

const getHeatmap = asyncWrapper(async (req, res) => {
  const data = await getHeatmapData(req.user._id);
  res.json({ success: true, data });
});

const getBestTime = asyncWrapper(async (req, res) => {
  const data = await getBestStudyTime(req.user._id);
  res.json({ success: true, data });
});

const getBurnout = asyncWrapper(async (req, res) => {
  const data = await detectBurnout(req.user._id);
  res.json({ success: true, data });
});

const getInsights = asyncWrapper(async (req, res) => {
  const data = await generateInsights(req.user._id);
  res.json({ success: true, data });
});

const getDailyBrief = asyncWrapper(async (req, res) => {
  const data = await generateDailyBrief(req.user._id);
  res.json({ success: true, data });
});

const getReviewQueueHandler = asyncWrapper(async (req, res) => {
  const data = await getReviewQueue(req.user._id);
  res.json({ success: true, data });
});

module.exports = { getDashboard, getChartData, getHeatmap, getBestTime, getBurnout, getInsights, getDailyBrief, getReviewQueueHandler };
