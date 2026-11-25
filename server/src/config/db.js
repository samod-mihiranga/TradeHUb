const mongoose = require('mongoose');
const { seedIfEmpty } = require('../utils/seedHelper');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  const allowFallback = process.env.USE_MEMORY_DB_FALLBACK === 'true';

  if (!uri) {
    throw new Error('MONGO_URI is required. Add your MongoDB connection string to server/.env.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return { mode: 'persistent' };
  } catch {
    console.warn('Could not connect to the configured MongoDB instance.');

    if (!allowFallback) {
      throw new Error('MongoDB connection failed. Check MONGO_URI and Atlas network access.');
    }

    try {
      console.log('Starting embedded in-memory MongoDB so the app runs without local MongoDB service...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`Embedded MongoDB connected: ${conn.connection.host} (in-memory dev mode)`);

      await seedIfEmpty();
      return { mode: 'memory' };
    } catch (fallbackErr) {
      console.error(`Failed to start embedded MongoDB: ${fallbackErr.message}`);
      throw fallbackErr;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

module.exports = { connectDB, disconnectDB };
