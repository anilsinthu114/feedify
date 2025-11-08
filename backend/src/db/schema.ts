import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  passwordHash: text("password_hash"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});

export const feedbacks = sqliteTable("feedbacks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
  sessionAt: text("session_at").notNull(),
  observations: text("observations"),
  recommendations: text("recommendations"),
  rating: integer("rating"),
  createdBy: integer("created_by").notNull(),
  secureToken: text("secure_token"),
  tokenExpiresAt: text("token_expires_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});
