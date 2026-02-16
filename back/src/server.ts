// ──────────────────────────────────────────────
// Server Entry Point
// ──────────────────────────────────────────────

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectToDatabase } from "./infrastructure/database/mongo.connection";
import measurementRoutes from "./interface/routes/measurement.routes";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/airocollect";

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Routes ──
app.use("/api/measurements", measurementRoutes);

// ── Health Check ──
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Bootstrap ──
async function startServer(): Promise<void> {
  await connectToDatabase(MONGODB_URI);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API base: http://localhost:${PORT}/api/measurements`);
  });
}

startServer();
