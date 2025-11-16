import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { initDb } from "./db/drizzle.js";
import { feedbacks, users } from "./db/schema.js";
import authRoutes from "./routes/auth.js";
import dashboardRouter from "./routes/dashboard.js";
import feedbackRoutes from "./routes/feedback.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "https://feedify-cddn.vercel.app/", credentials: true }));
app.use(cookieParser());

// Health check
app.get("/", (req, res) => res.json({ ok: true, message: "Expert Feedback API is running 🚀" }));

// Initialize DB, then mount routes + start server
(async () => {
  try {
    const db = await initDb();

    const existingUsers = await db.select().from(users).limit(1);
    const existingFeedbacks = await db.select().from(feedbacks).limit(1);
    console.log("🗄️ Database connected successfully ✅");
    console.log(`📋 Users table rows: ${existingUsers.length}`);
    console.log(`📋 Feedbacks table rows: ${existingFeedbacks.length}`);

    // Pass db to routes (if needed)
    app.locals.db = db;

    // Mount routes after DB ready
    app.use("/api/auth", authRoutes);
    app.use("/api/feedback", feedbackRoutes);

app.use("/api/dashboard", dashboardRouter);

    app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error("⚠️ Database connection failed:", err);
  }
})();

await new Promise(() => {});
