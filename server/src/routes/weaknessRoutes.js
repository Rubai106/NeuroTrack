const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { getWeaknesses, addQuizResult, deleteEntry } = require('../controllers/weaknessController');
router.use(protect);
router.get('/', getWeaknesses);
router.post('/quiz', addQuizResult);
router.delete('/:id', deleteEntry);
module.exports = router;
