const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new AppError('Not authorized', 401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key');
    req.user = await User.findById(decoded.id).select('name email level xp currentStreak');
    if (!req.user) throw new AppError('User not found', 401);

    next();
  } catch (err) { next(err); }
};

module.exports = { protect };
