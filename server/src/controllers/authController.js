const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, asyncWrapper } = require('../middleware/errorHandler');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret_key', { expiresIn: '30d' });

const register = asyncWrapper(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new AppError('All fields required', 400);
  const user = await User.create({ name, email, password });
  const token = signToken(user._id);
  res.status(201).json({ success: true, token, user });
});

const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password required', 400);
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password)))
    throw new AppError('Invalid credentials', 401);
  const token = signToken(user._id);
  const { password: _, ...userData } = user.toObject();
  res.json({ success: true, token, user: userData });
});

const getMe = asyncWrapper(async (req, res) => {
  res.json({ success: true, user: req.user });
});

const updateProfile = asyncWrapper(async (req, res) => {
  const { name, examDate, examName, subjects, preferences } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, examDate, examName, subjects, preferences },
    { new: true, runValidators: true }
  );
  res.json({ success: true, user });
});

module.exports = { register, login, getMe, updateProfile };
