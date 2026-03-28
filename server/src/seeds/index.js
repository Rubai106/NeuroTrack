require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const StudySession = require('../models/StudySession');
const Goal = require('../models/Goal');
const Note = require('../models/Note');
const WeaknessEntry = require('../models/WeaknessEntry');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neurotrack';

const subjects = ['Mathematics', 'Physics', 'Computer Science', 'Chemistry', 'English'];
const topics = {
  Mathematics: ['Calculus', 'Linear Algebra', 'Statistics', 'Trigonometry', 'Number Theory'],
  Physics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Quantum Physics'],
  'Computer Science': ['Data Structures', 'Algorithms', 'Operating Systems', 'Databases', 'Networks'],
  Chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Biochemistry'],
  English: ['Grammar', 'Writing', 'Literature', 'Comprehension', 'Vocabulary']
};

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await Promise.all([User, StudySession, Goal, Note, WeaknessEntry].map(M => M.deleteMany({})));
  console.log('Cleared existing data');

  // Create demo user
  const user = await User.create({
    name: 'Alex Chen',
    email: 'demo@neurotrack.app',
    password: 'demo123',
    currentStreak: 8,
    longestStreak: 21,
    lastStudyDate: new Date(),
    xp: 1450,
    level: 5,
    examDate: daysAgo(-45),
    examName: 'Final Semester Exams',
    subjects: subjects.map((s, i) => ({
      name: s,
      color: ['#4CAF50','#4A90E2','#FF9800','#9C27B0','#F44336'][i]
    })),
    badges: [
      { id: 'first_session', name: 'First Step', description: 'Logged your first study session', icon: '🎯', earnedAt: daysAgo(60) },
      { id: 'streak_3', name: 'Getting Started', description: '3-day study streak', icon: '🌱', earnedAt: daysAgo(30) },
      { id: 'streak_7', name: 'Week Warrior', description: '7-day study streak', icon: '🔥', earnedAt: daysAgo(10) },
      { id: 'hours_10', name: 'Dedicated', description: 'Studied 10+ hours total', icon: '📚', earnedAt: daysAgo(20) },
    ]
  });
  console.log('Created user:', user.email);

  // Create 60 days of study sessions
  const sessions = [];
  for (let i = 60; i >= 0; i--) {
    if (Math.random() < 0.75) { // 75% chance studied that day
      const numSessions = rand(1, 3);
      for (let j = 0; j < numSessions; j++) {
        const subject = pick(subjects);
        const topic = pick(topics[subject]);
        const sessionDate = daysAgo(i);
        sessions.push({
          userId: user._id,
          subject, topic,
          durationMinutes: rand(25, 120),
          difficulty: pick(['easy', 'medium', 'hard']),
          focusQuality: rand(5, 10),
          energyLevel: rand(2, 5),
          distractionMinutes: rand(0, 15),
          sessionType: pick(['pomodoro', 'manual', 'deep-work', 'review']),
          pomodoroCount: rand(0, 4),
          mood: pick(['great', 'good', 'okay', 'tired']),
          date: sessionDate,
          completedAt: sessionDate,
          productivityScore: rand(60, 95)
        });
      }
    }
  }
  await StudySession.insertMany(sessions);
  console.log(`Created ${sessions.length} study sessions`);

  // Goals
  const now = new Date();
  await Goal.insertMany([
    { userId: user._id, title: 'Daily Study Target', type: 'daily', subject: 'All', targetMinutes: 120, currentMinutes: 75, status: 'active', period: { start: new Date(now.toDateString()), end: new Date(now.toDateString()) } },
    { userId: user._id, title: 'Weekly Mathematics', type: 'weekly', subject: 'Mathematics', targetMinutes: 300, currentMinutes: 180, status: 'active', period: { start: daysAgo(3), end: daysAgo(-4) } },
    { userId: user._id, title: 'Finish CS Algorithms', type: 'monthly', subject: 'Computer Science', targetMinutes: 1200, currentMinutes: 640, status: 'active', period: { start: daysAgo(15), end: daysAgo(-15) } },
    { userId: user._id, title: 'Exam Prep Sprint', type: 'exam', subject: 'All', examName: 'Final Semester', targetMinutes: 3000, currentMinutes: 1800, status: 'active', examDate: daysAgo(-45), period: { start: daysAgo(14), end: daysAgo(-45) } },
    { userId: user._id, title: 'Physics Weekly', type: 'weekly', subject: 'Physics', targetMinutes: 240, currentMinutes: 240, status: 'completed', isCompleted: true, completedAt: daysAgo(3), period: { start: daysAgo(10), end: daysAgo(3) } },
  ]);
  console.log('Created goals');

  // Notes
  await Note.insertMany([
    { userId: user._id, title: 'Integration by Parts', subject: 'Mathematics', topic: 'Calculus', content: '## Integration by Parts\n\nFormula: ∫u dv = uv − ∫v du\n\n**When to use:** When integrating a product of two functions.\n\n**LIATE rule for choosing u:**\n- L - Logarithms\n- I - Inverse trig\n- A - Algebraic\n- T - Trigonometric\n- E - Exponential', tags: ['formula', 'important', 'calculus'], isPinned: true },
    { userId: user._id, title: "Newton's Laws Summary", subject: 'Physics', topic: 'Mechanics', content: '**First Law:** An object at rest stays at rest unless acted on by a net force.\n\n**Second Law:** F = ma\n\n**Third Law:** Every action has an equal and opposite reaction.', tags: ['laws', 'fundamental', 'mechanics'], isPinned: true },
    { userId: user._id, title: 'Big O Notation Cheatsheet', subject: 'Computer Science', topic: 'Algorithms', content: '| Algorithm | Best | Average | Worst |\n|-----------|------|---------|-------|\n| Binary Search | O(1) | O(log n) | O(log n) |\n| Merge Sort | O(n log n) | O(n log n) | O(n log n) |\n| Quick Sort | O(n log n) | O(n log n) | O(n²) |', tags: ['algorithms', 'complexity', 'cheatsheet'] },
    { userId: user._id, title: 'Organic Chemistry Reactions', subject: 'Chemistry', topic: 'Organic Chemistry', content: 'Key reactions to remember:\n1. **SN1** - Unimolecular nucleophilic substitution\n2. **SN2** - Bimolecular nucleophilic substitution\n3. **E1/E2** - Elimination reactions\n\nSubstrate matters: tertiary → SN1/E1, primary → SN2/E2', tags: ['reactions', 'mechanisms'] },
    { userId: user._id, title: 'Essay Structure Template', subject: 'English', topic: 'Writing', content: '**Introduction:** Hook → Context → Thesis\n\n**Body Paragraphs:** Topic sentence → Evidence → Analysis → Transition\n\n**Conclusion:** Restate thesis → Synthesize arguments → Broader implication', tags: ['writing', 'template', 'structure'] },
  ]);
  console.log('Created notes');

  // Weakness entries
  await WeaknessEntry.insertMany([
    { userId: user._id, subject: 'Mathematics', topic: 'Integration', totalAttempts: 40, wrongAttempts: 22, studyWeightHours: 3, confidenceScore: 35, lastTestedDate: daysAgo(2) },
    { userId: user._id, subject: 'Physics', topic: 'Quantum Physics', totalAttempts: 20, wrongAttempts: 14, studyWeightHours: 1, confidenceScore: 25, lastTestedDate: daysAgo(5) },
    { userId: user._id, subject: 'Chemistry', topic: 'Organic Mechanisms', totalAttempts: 30, wrongAttempts: 16, studyWeightHours: 4, confidenceScore: 45, lastTestedDate: daysAgo(3) },
    { userId: user._id, subject: 'Computer Science', topic: 'Dynamic Programming', totalAttempts: 25, wrongAttempts: 10, studyWeightHours: 6, confidenceScore: 60, lastTestedDate: daysAgo(7) },
    { userId: user._id, subject: 'Mathematics', topic: 'Linear Algebra', totalAttempts: 35, wrongAttempts: 8, studyWeightHours: 8, confidenceScore: 72, lastTestedDate: daysAgo(1) },
    { userId: user._id, subject: 'English', topic: 'Grammar', totalAttempts: 50, wrongAttempts: 6, studyWeightHours: 5, confidenceScore: 85, lastTestedDate: daysAgo(4) },
  ]);
  console.log('Created weakness entries');

  console.log('\n✅ Seed complete!');
  console.log('Login: demo@neurotrack.app / demo123');
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
