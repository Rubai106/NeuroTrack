const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const ensureDemoUser = require('./seeds/ensureDemoUser');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet());
app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
    ? true // Allow all origins in production
    : process.env.CLIENT_URL || 'http://localhost:5173', 
  credentials: true 
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/api/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    service: 'NeuroTrack API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/sessions',     require('./routes/sessionRoutes'));
app.use('/api/goals',        require('./routes/goalRoutes'));
app.use('/api/analytics',    require('./routes/analyticsRoutes'));
app.use('/api/notes',        require('./routes/noteRoutes'));
app.use('/api/weakness',     require('./routes/weaknessRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/predictions',  require('./routes/predictionRoutes'));
app.use('/api/profile',      require('./routes/profileRoutes'));
app.use('/api',              require('./routes/engineRoutes'));

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🚀 NeuroTrack API → http://localhost:${PORT}`);
  console.log(`📊 Env: ${process.env.NODE_ENV || 'development'}\n`);
  
  // Ensure demo user exists in production
  if (process.env.NODE_ENV === 'production') {
    console.log('🔧 Ensuring demo user exists...');
    try {
      await ensureDemoUser();
      console.log('✅ Demo user check complete');
    } catch (error) {
      console.error('❌ Failed to ensure demo user:', error.message);
    }
  }
});

module.exports = app;
