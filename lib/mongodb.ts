import mongoose from 'mongoose';

const connectionString = process.env.MONGODB_URI || '';

if (!connectionString) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (!connectionString) {
      throw new Error('MongoDB connection string is not defined');
    }
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(connectionString as string, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
