const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { getGamification } = require('../controllers/gamificationController');
router.use(protect);
router.get('/', getGamification);
module.exports = router;
