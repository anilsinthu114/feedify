import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import express from "express";
import { initDb } from "../db/drizzle.js";
import { users } from "../db/schema.js";
import { AuthenticatedRequest, authorize } from "../middleware/authorize.js";
import { signJwt, verifyJwt } from "../utils/jwt.js";

const router = express.Router();

let dbPromise: any = null;
async function getDb() {
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["admin", "manager", "hr", "user"],
  manager: ["hr", "user"],
  hr: ["user"],
};

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
      .returning()
      .execute();

    return res.status(201).json({ ok: true, userId: created.id });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

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

    let ok = false;
    let needsUpgrade = false;

    if (user.passwordHash?.startsWith("$2")) {
      ok = await bcrypt.compare(password, user.passwordHash);
    } else {
      ok = password === user.passwordHash;
      needsUpgrade = ok;
    }

    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (needsUpgrade) {
      try {
        const newHash = await bcrypt.hash(password, 10);
        await db
          .update(users)
          .set({ passwordHash: newHash })
          .where(eq(users.id, user.id))
          .execute(); // ensure immediate persistence
      } catch (upgradeErr) {
        console.error("Password upgrade failed:", upgradeErr);
      }
    }

    // Include name and email in the JWT
    const token = signJwt({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" || false,
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

// PROFILE: ensure name/email are present and up-to-date
router.get("/me", async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = verifyJwt<{ sub: number; role: string; name?: string; email?: string }>(token);
    if (!payload) return res.status(401).json({ error: "Invalid token" });

    // Always refresh from DB to reflect immediate updates
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

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || false,
  });
  return res.json({ ok: true });
});

export default router;
