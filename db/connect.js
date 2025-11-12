const mongoose = require('mongoose');

// For Vercel serverless, cache connection in global
const cached = global.mongoose || { conn: null, promise: null };
if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in environment variables!');
    console.error('   Set MONGODB_URI in Vercel: Settings → Environment Variables');
    console.error('   Format: mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority');
    return null;
  }

  // Validate connection string format
  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    console.error('❌ Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://');
    return null;
  }

  // Log connection attempt (mask password)
  const maskedUri = MONGODB_URI.replace(/:[^:@]+@/, ':****@');
  console.log('🔌 Attempting MongoDB connection...');
  console.log('   URI (masked):', maskedUri);

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

  // Start new connection with MongoDB recommended options
  try {
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      // MongoDB recommended options
      retryWrites: true,
      w: 'majority',
      // For serverless environments
      bufferCommands: false,
      bufferMaxEntries: 0,
    };

    cached.promise = mongoose.connect(MONGODB_URI, options).then(async (mongoose) => {
      // Send a ping to confirm successful connection (like MongoDB's example)
      try {
        await mongoose.connection.db.admin().ping();
        console.log('✅ Connected to MongoDB - Ping successful!');
      } catch (pingError) {
        console.warn('Connected but ping failed:', pingError);
      }
      
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
    console.error('Connection string (masked):', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
    cached.promise = null;
    throw error; // Throw error so caller knows connection failed
  }
}

module.exports = connectDB;

