const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set. Using in-memory storage.');
    return;
  }

  try {
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    };

    await mongoose.connect(MONGODB_URI, options);
    
    isConnected = true;
    console.log('✅ Connected to MongoDB');
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    // Don't throw - allow app to continue with in-memory storage
  }
}

// For Vercel serverless, we need to handle connection reuse
if (process.env.VERCEL) {
  // In serverless, reuse connection across invocations
  if (!global.mongoose) {
    global.mongoose = { conn: null, promise: null };
  }
}

module.exports = connectDB;

