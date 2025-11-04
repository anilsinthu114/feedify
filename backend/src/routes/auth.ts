import bcrypt from "bcryptjs";
import { eq, Name } from "drizzle-orm";
import express from "express";
import { initDb } from "../db/drizzle.js";
import { users } from "../db/schema.js";
import { AuthenticatedRequest, authorize } from "../middleware/authorize.js";
import { signJwt, verifyJwt } from "../utils/jwt.js";

const router = express.Router();

// 🔹 Lazy-load DB
let dbPromise: any = null;
async function getDb() {
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

// ✅ Define role hierarchy clearly
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["admin", "manager", "hr", "user"],
  manager: ["hr", "user"],
  hr: ["user"],
};

// 🟢 REGISTER — only allowed roles can create other roles
router.post("/register", authorize(["admin", "manager", "hr"]), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, email, password, role } = req.body;
    const creatorRole = req.user?.role || "user";

    console.log("🆕 Registration attempt:", { name, email, role, creatorRole });

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // ✅ Enforce creation rule based on role hierarchy
    const allowedRoles = ROLE_PERMISSIONS[creatorRole] || [];
    if (!allowedRoles.includes(role)) {
      console.warn(`🚫 ${creatorRole} not allowed to create ${role}`);
      return res.status(403).json({
        error: `You (${creatorRole}) are not authorized to create ${role} users.`,
      });
    }

    const db = await getDb();

    // Check if email already exists
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

    console.log(`✅ ${creatorRole} created ${role} user: ${email}`);
    res.status(201).json({ ok: true, userId: created.id });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Login attempt for:", email);

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const db = await getDb();

    // 🔹 Fetch user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((r) => r[0]);

    if (!user) {
      console.warn("🚫 No user found:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    let ok = false;
    let needsUpgrade = false;

    // ✅ If passwordHash is bcrypt hash (starts with "$2"), compare using bcrypt
    if (user.passwordHash?.startsWith("$2")) {
      ok = await bcrypt.compare(password, user.passwordHash);
    } else {
      // ✅ Fallback for plain text passwords (legacy)
      ok = password === user.passwordHash;
      needsUpgrade = ok; // mark for upgrade if valid
    }

    if (!ok) {
      console.warn("🚫 Invalid credentials for:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ Auto-upgrade plain text password to bcrypt
    if (needsUpgrade) {
      try {
        const newHash = await bcrypt.hash(password, 10);
        await db.update(users)
          .set({ passwordHash: newHash })
          .where(eq(users.id, user.id));
        console.log(`🔒 Auto-upgraded password for ${email}`);
      } catch (upgradeErr) {
        console.error("⚠️ Password upgrade failed:", upgradeErr);
      }
    }

    // ✅ Issue JWT with actual role
    const token = signJwt({ sub: user.id,  role: user.role });

    // ✅ Set secure HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 5* 24 * 60 * 60 * 1000, // 7 days
    });

    console.log(`✅ Login successful: ${user.role} (${email})`);
    res.json({
      ok: true,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🟢 GET ALL USERS — for admin view
router.get("/users", authorize(["admin"]), async (req, res) => {
  try {
    const db = await getDb();
    const allUsers = await db.select().from(users);
    res.json({ ok: true, users: allUsers });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🟢 PROFILE
router.get("/me", async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = verifyJwt<{ sub: number; role: string }>(token);
    if (!payload) return res.status(401).json({ error: "Invalid token" });

    res.json({ ok: true, user: payload });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🟢 LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

export default router;
