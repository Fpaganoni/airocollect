// ──────────────────────────────────────────────
// Infrastructure — Mongoose Connection
// ──────────────────────────────────────────────

import mongoose from "mongoose";

export async function connectToDatabase(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}
