const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getDashboard, getChartData, getHeatmap, getBestTime, getBurnout,
  getInsights, getDailyBrief, getReviewQueueHandler
} = require('../controllers/analyticsController');

router.use(protect);
router.get('/dashboard',     getDashboard);
router.get('/charts',        getChartData);
router.get('/heatmap',       getHeatmap);
router.get('/best-time',     getBestTime);
router.get('/burnout',       getBurnout);
router.get('/insights',      getInsights);
router.get('/brief',         getDailyBrief);
router.get('/review-queue',  getReviewQueueHandler);

module.exports = router;
