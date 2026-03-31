require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neurotrack';

async function ensureDemoUser() {
  const isMain = require.main === module;
  
  try {
    // Only connect if we're not already connected and we're the main process
    if (isMain && mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
      console.log('Connected to MongoDB (standalone)');
    }

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: 'demo@neurotrack.app' });
    
    if (existingUser) {
      console.log('Demo user already exists');
      return true;
    }

    // Create demo user if doesn't exist
    const user = await User.create({
      name: 'Alex Chen',
      email: 'demo@neurotrack.app',
      password: 'demo123',
      currentStreak: 8,
      longestStreak: 21,
      lastStudyDate: new Date(),
      xp: 1450,
      level: 5,
      examDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      examName: 'Final Semester Exams',
      subjects: [
        { name: 'Mathematics', color: '#4CAF50' },
        { name: 'Physics', color: '#4A90E2' },
        { name: 'Computer Science', color: '#FF9800' },
        { name: 'Chemistry', color: '#9C27B0' },
        { name: 'English', color: '#F44336' }
      ],
      badges: [
        { id: 'first_session', name: 'First Step', description: 'Logged your first study session', icon: '🎯', earnedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        { id: 'streak_3', name: 'Getting Started', description: '3-day study streak', icon: '🌱', earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { id: 'streak_7', name: 'Week Warrior', description: '7-day study streak', icon: '🔥', earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { id: 'hours_10', name: 'Dedicated', description: 'Studied 10+ hours total', icon: '📚', earnedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
      ]
    });

    console.log('Demo user created:', user.email);
    console.log('Login credentials: demo@neurotrack.app / demo123');
    return true;
    
  } catch (error) {
    console.error('Error ensuring demo user:', error.message);
    if (isMain) process.exit(1);
    throw error;
  } finally {
    // Only disconnect if we're the main process and we connected
    if (isMain && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

// Run if called directly
if (require.main === module) {
  ensureDemoUser().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = ensureDemoUser;

