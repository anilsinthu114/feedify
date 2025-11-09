import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import express from "express";
import { initDb } from "../db/drizzle.js";
import { users } from "../db/schema.js";
import { AuthenticatedRequest, authorize } from "../middleware/authorize.js";
import { signJwt, verifyJwt } from "../utils/jwt.js";
import { sendPasswordResetEmail, sendUserCredentialsEmail } from "../utils/mailer.js";
import { generateRandomPassword } from "../utils/passwordGenerator.js";

const router = express.Router();

let dbPromise: any = null;
async function getDb() {
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

/** Role hierarchy for who can create whom */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["admin", "manager", "hr", "user"],
  manager: ["hr", "user"],
  hr: ["user"],
};

/**
 * ✅ Create User (only HR or above)
 * Auto-generates password and emails credentials
 */
router.post("/create-user", authorize(["hr"]), async (req: AuthenticatedRequest, res) => {
  try {
    const { userName, userEmail } = req.body;

    if (!userName || !userEmail) {
      return res.status(400).json({ error: "Username and email are required" });
    }

    const db = await getDb();

    const [existingUser] = await db.select().from(users).where(eq(users.email, userEmail));

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

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

    console.log(`👤 Auto-created user: ${userEmail}`);

    await sendUserCredentialsEmail(userEmail, userName, randomPassword);

    return res.status(201).json({
      message: "User created successfully",
      user: { id: newUser.id, name: userName, email: userEmail },
    });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * ✅ Manual Register (by admin/manager/hr)
 */
router.post("/register", authorize(["admin", "manager", "hr"]), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, email, password, role } = req.body;
    const creatorRole = req.user?.role || "user";

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const allowedRoles = ROLE_PERMISSIONS[creatorRole] || [];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: `You (${creatorRole}) are not authorized to create ${role} users.`,
      });
    }

    const db = await getDb();

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((r) => r[0]);

    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [created] = await db
      .insert(users)
      .values({ name, email, passwordHash, role })
      .returning();

    return res.status(201).json({ ok: true, userId: created.id });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ Login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const db = await getDb();
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((r) => r[0]);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signJwt({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      ok: true,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ Forgot Password
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) return res.status(404).json({ error: "User not found" });

    const resetToken = crypto.randomBytes(24).toString("hex");
    const resetExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await db
      .update(users)
      .set({ resetToken, resetExpiresAt })
      .where(eq(users.id, user.id));

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(email, user.name, resetLink);

    res.json({ ok: true, message: "Password reset link sent to email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ Get all users (Admin only)
 */
router.get("/users", authorize(["admin"]), async (req, res) => {
  try {
    const db = await getDb();
    const allUsers = await db.select().from(users);
    return res.json({ ok: true, users: allUsers });
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ Get current user
 */
router.get("/me", async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = verifyJwt<{ sub: number; role: string; name?: string; email?: string }>(token);
    if (!payload) return res.status(401).json({ error: "Invalid token" });

    const db = await getDb();
    const dbUser = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1)
      .then((r) => r[0]);

    if (!dbUser) {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.json({
      ok: true,
      user: {
        sub: dbUser.id,
        role: dbUser.role,
        name: dbUser.name,
        email: dbUser.email,
      },
    });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ Logout
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res.json({ ok: true });
});

export default router;
