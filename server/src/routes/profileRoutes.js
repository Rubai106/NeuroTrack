const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { getCoachMessage } = require('../controllers/coachController');
// Profile updates handled via /api/auth/profile
router.post('/coach', protect, getCoachMessage);
module.exports = router;
