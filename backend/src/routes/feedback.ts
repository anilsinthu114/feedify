import bcrypt from "bcrypt";
import crypto from "crypto";
import { desc, eq } from "drizzle-orm";
import express from "express";
import { initDb } from "../db/drizzle.js";
import { feedbacks, users } from "../db/schema.js";
import { verifyJwt } from "../utils/jwt.js";
import { sendFeedbackLinkEmail, sendUserCredentialsEmail } from "../utils/mailer.js";
import { generateRandomPassword } from "../utils/passwordGenerator.js";
const router = express.Router();
let dbPromise: any = null;
async function getDb() {
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

router.post("/", async (req, res) => {
  try {
    const {
      userName,
      userEmail,
      sessionAt,
      observations,
      recommendations,
      rating,
    } = req.body;

    console.log("📝 Incoming feedback:", req.body);

    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const payload = verifyJwt<{ sub: number; role: string }>(token);
    if (!payload || payload.role !== "hr") {
      return res.status(403).json({ error: "Unauthorized - HR access only" });
    }

    const createdBy = payload.sub;
    if (!userName || !userEmail || !sessionAt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = await getDb();
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1)
      .then((r) => r[0]);

    let userId = existingUser?.id;

    if (!existingUser) {

      const randomPassword = generateRandomPassword(userName, userEmail);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const [newUser] = await db
        .insert(users)
        .values({
          name: userName,
          email: userEmail,
          passwordHash,
          role: "user",
        })
        .returning();

      userId = newUser.id;

      console.log(`👤 Auto-created user: ${userEmail}`);
      await sendUserCredentialsEmail(userEmail, userName, randomPassword);
    }

    const secureToken = crypto.randomBytes(24).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await db.insert(feedbacks).values({
      userName,
      userEmail,
      sessionAt,
      observations,
      recommendations,
      rating,
      createdBy,
      secureToken,
      tokenExpiresAt,
      createdAt: new Date().toISOString(),
    });

    const link = `${process.env.FRONTEND_URL}/feedback/view/${secureToken}`;

    await sendFeedbackLinkEmail(userEmail, userName, link, secureToken);

    res.json({
      ok: true,
      message: "Feedback created, user account ensured, and email sent",
    });
  } catch (err) {
    console.error("❌ Feedback creation error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const db = await getDb();
    
    const [record] = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.secureToken, token));
    if (!record) return res.status(404).json({ error: "Invalid or expired token" });
    
    if (record.tokenExpiresAt && new Date(record.tokenExpiresAt) < new Date()) {
      return res.status(410).json({ error: "Token expired" });
    }
    res.json({ ok: true, feedback: record });
  } catch (err) {
    console.error("❌ Feedback token verification error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/view/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const db = await getDb();

    const [record] = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.secureToken, token)).limit(1);

    if (!record) return res.status(404).json({ error: "Invalid or expired link" });
    if (record.tokenExpiresAt && new Date(record.tokenExpiresAt) < new Date()) {
      return res.status(410).json({ error: "Link expired" });
    }

    res.json({ ok: true, feedback: record });
  } catch (err) {
    console.error("❌ Feedback token view error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/view", async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    const payload = verifyJwt<{ role: string }>(token);

    if (!payload || payload.role !== "hr")
      return res.status(403).json({ error: "Unauthorized" });

    const userIdParam = req.query.userId as string | undefined;
    const userId = userIdParam !== undefined ? Number(userIdParam) : undefined;
    if (userIdParam !== undefined && Number.isNaN(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const db = await getDb();
    let query = db.select().from(feedbacks);
    if (userId !== undefined) {
      query = query.where(eq(feedbacks.createdBy, userId));
    }

    const allFeedbacks = await query.orderBy(desc(feedbacks.createdAt));

    res.json({ ok: true, feedbacks: allFeedbacks });
  } catch (err) {
    console.error("❌ Feedback view error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/list", async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    const payload = verifyJwt<{ role: string }>(token);

    if (!payload || payload.role !== "admin")
      return res.status(403).json({ error: "Unauthorized" });

    const db = await getDb();
    const list = await db
      .select()
      .from(feedbacks)
      .orderBy(desc(feedbacks.createdAt));

    res.json({ ok: true, feedbacks: list });
  } catch (err) {
    console.error("❌ Admin feedback list error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:user_id/feedbacks", async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    const payload = verifyJwt<{ sub: number; role: string }>(token);
    if (!payload || payload.role !== "user") {
      return res.status(403).json({ error: "Unauthorized - User access only" });
    }
    const userId = payload.sub;
    const db = await getDb();
    const userFeedbacks = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.createdBy, userId))
      .orderBy(desc(feedbacks.createdAt));
    res.json({ ok: true, feedbacks: userFeedbacks });
  } catch (err) {
    console.error("❌ User feedback retrieval error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;

