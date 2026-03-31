const Note = require('../models/Note');
const { AppError, asyncWrapper } = require('../middleware/errorHandler');
const { awardXP } = require('../services/gamificationService');

const getNotes = asyncWrapper(async (req, res) => {
  const { subject, search, tag } = req.query;
  const query = { userId: req.user._id };
  if (subject) query.subject = subject;
  if (tag) query.tags = tag;
  if (search) query.$text = { $search: search };
  const notes = await Note.find(query).sort({ isPinned: -1, updatedAt: -1 }).lean();

  res.json({ success: true, data: notes });
});

const createNote = asyncWrapper(async (req, res) => {
  const note = await Note.create({ ...req.body, userId: req.user._id });
  await awardXP(req.user._id, 'noteAdded');
  res.status(201).json({ success: true, data: note });
});

const updateNote = asyncWrapper(async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id }, req.body, { new: true }
  );
  if (!note) throw new AppError('Note not found', 404);
  res.json({ success: true, data: note });
});

const deleteNote = asyncWrapper(async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!note) throw new AppError('Note not found', 404);
  res.json({ success: true, message: 'Note deleted' });
});

module.exports = { getNotes, createNote, updateNote, deleteNote };
