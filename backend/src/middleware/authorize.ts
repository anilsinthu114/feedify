import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../utils/jwt.js";

// ✅ Extend Express request to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    sub: number; // user ID
    role: string;
  };
}

/**
 * Middleware factory that checks whether the user’s JWT is valid and role is allowed.
 * @param allowedRoles - array of roles allowed to access the route
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // ✅ Get token from cookie or Bearer header
      const token =
        req.cookies?.token ||
        req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        console.warn("❌ Missing auth token");
        return res.status(401).json({ error: "Unauthorized - Missing token" });
      }

      // ✅ Verify JWT
      const payload = verifyJwt<{ sub: number; role: string }>(token);
      if (!payload) {
        console.warn("❌ Invalid token provided");
        return res.status(401).json({ error: "Unauthorized - Invalid token" });
      }

      // ✅ Check role authorization
      const userRole = payload.role;
      if (!allowedRoles.includes(userRole)) {
        console.warn(`🚫 Role ${userRole} not authorized for this route`);
        return res.status(403).json({ error: "Forbidden - Access denied" });
      }

      // ✅ Attach to request object for downstream handlers
      req.user = { sub: payload.sub, role: userRole };

      next();
    } catch (err) {
      console.error("⚠️ Authorization middleware error:", err);
      res.status(401).json({ error: "Unauthorized" });
    }
  };
};
