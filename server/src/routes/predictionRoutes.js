const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { getPrediction } = require('../controllers/predictionController');
router.use(protect);
router.get('/', getPrediction);
module.exports = router;
