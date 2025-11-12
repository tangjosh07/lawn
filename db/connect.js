const mongoose = require('mongoose');

// For Vercel serverless, cache connection in global
const cached = global.mongoose || { conn: null, promise: null };
if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set. Using in-memory storage.');
    return;
  }

  // If already connected, return cached connection
  if (cached.conn) {
    console.log('Using existing database connection');
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (cached.promise) {
    console.log('Waiting for existing connection promise');
    return await cached.promise;
  }

  // Start new connection
  try {
    const options = {
      serverSelectionTimeoutMS: 10000, // Increased to 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 10000, // 10 seconds
      bufferCommands: false,
      bufferMaxEntries: 0,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(MONGODB_URI, options).then((mongoose) => {
      console.log('✅ Connected to MongoDB');
      cached.conn = mongoose;
      cached.promise = null;
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB connection promise rejected:', error);
      cached.promise = null;
      throw error;
    });

    const conn = await cached.promise;
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    cached.promise = null;
    // Don't throw - allow app to continue with in-memory storage
    return null;
  }
}

module.exports = connectDB;

