const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getSessions, createSession, updateSession, deleteSession, getTodaySessions
} = require('../controllers/sessionController');

router.use(protect);
router.get('/', getSessions);
router.get('/today', getTodaySessions);
router.post('/', createSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

module.exports = router;
