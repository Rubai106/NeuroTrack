const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { getBehaviorProfile, getReadiness, getDailyBrief, evaluateDecision } = require('../controllers/engineController');

router.use(protect);
router.get('/behavior-profile', getBehaviorProfile);
router.get('/readiness/:subject', getReadiness);
router.get('/system/daily-brief', getDailyBrief);
router.post('/decision/evaluate', evaluateDecision);

module.exports = router;
