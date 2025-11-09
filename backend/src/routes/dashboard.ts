// src/routes/dashboard.ts
import { desc, eq } from "drizzle-orm";
import express from "express";
import { initDb } from "../db/drizzle.js";
import { feedbacks, users } from "../db/schema.js";
import { verifyJwt } from "../utils/jwt.js";

const router = express.Router();

let dbPromise: any = null;
async function getDb() {
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

/**
 * /api/dashboard
 * Returns role-based dashboard data
 */
router.get("/", async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const payload = verifyJwt<{ sub: number; role: string }>(token);
    if (!payload) return res.status(403).json({ error: "Invalid token" });

    const { sub: userId, role } = payload;
    const db = await getDb();

    // Default structure
    let data: Record<string, any> = {};

    switch (role) {
      case "admin": {
        const allUsers = await db.select().from(users);
        const allFeedbacks = await db
          .select()
          .from(feedbacks)
          .orderBy(desc(feedbacks.createdAt));

        data = { users: allUsers, feedbacks: allFeedbacks };
        break;
      }

      case "hr": {
        const hrFeedbacks = await db
          .select()
          .from(feedbacks)
          .where(eq(feedbacks.createdBy, userId))
          .orderBy(desc(feedbacks.createdAt));

        data = { feedbacks: hrFeedbacks };
        break;
      }

      case "manager": {
        const summary = await db
          .select({
            id: feedbacks.id,
            userName: feedbacks.userName,
            sessionAt: feedbacks.sessionAt,
            rating: feedbacks.rating,
          })
          .from(feedbacks)
          .orderBy(desc(feedbacks.createdAt));

        data = { feedbackSummary: summary };
        break;
      }

      case "user": {
        const myFeedback = await db
          .select()
          .from(feedbacks)
          .where(eq(feedbacks.userEmail, req.userEmail || ""))
          .orderBy(desc(feedbacks.createdAt));

        data = { myFeedback };
        break;
      }

      default:
        return res.status(403).json({ error: "Unknown role" });
    }

    res.json({ ok: true, data });
  } catch (err) {
    console.error("❌ Dashboard fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
