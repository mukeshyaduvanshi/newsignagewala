import mongoose from "mongoose";
import { MongooseCache } from "@/types/database.types";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  // ✅ already connected & healthy
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // ❗ important: reset stale connection
  if (cached.conn && mongoose.connection.readyState !== 1) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: true,              // ✅ allow buffering during cold start
      serverSelectionTimeoutMS: 5000,     // ✅ fail fast (Vercel-friendly)
      maxPoolSize: 10,                    // ✅ limit connections
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;

  
