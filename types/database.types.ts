import mongoose from "mongoose";

// Database connection types
export interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}
