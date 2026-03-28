const { asyncWrapper, AppError } = require('../middleware/errorHandler');
const { getCoachResponse } = require('../services/coachService');

const getCoachMessage = asyncWrapper(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new AppError('Message required', 400);
  const response = await getCoachResponse(req.user._id, message);
  res.json({ success: true, data: response });
});

module.exports = { getCoachMessage };
