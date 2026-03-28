const { asyncWrapper } = require('../middleware/errorHandler');
const { predictExamReadiness } = require('../services/predictionService');

const getPrediction = asyncWrapper(async (req, res) => {
  const data = await predictExamReadiness(req.user._id);
  res.json({ success: true, data });
});

module.exports = { getPrediction };
