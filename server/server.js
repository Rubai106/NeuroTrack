const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/sessions', require('./src/routes/sessions'));
app.use('/api/goals', require('./src/routes/goals'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/weakness', require('./src/routes/weakness'));
app.use('/api/notes', require('./src/routes/notes'));
app.use('/api/predictions', require('./src/routes/predictions'));
app.use('/api/coach', require('./src/routes/coach'));
app.use('/api/gamification', require('./src/routes/gamification'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'NeuroTrack API running' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 NeuroTrack server running on port ${PORT}`));
