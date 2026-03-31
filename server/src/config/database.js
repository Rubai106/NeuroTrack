const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI is not defined in environment variables. Using default local fallback.');
  }

  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/neurotrack'
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error('   Ensure MONGODB_URI is correctly set in your environment (e.g., Render Dashboard).');
    // We no longer call process.exit(1) to allow the app to stay alive for debugging
  }
};


module.exports = connectDB;

