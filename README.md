# 🧠 Expert Feedback System

A secure, role-based full-stack feedback management platform built using **Next.js (TypeScript)**, **Express**, **Drizzle ORM**, and **Bun** runtime.  
It enables organizations to **collect, manage, and review expert feedback** efficiently with access control for Admins, Managers, HRs, and Users.

# i am just writing key important  files in structure...

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js (React + TypeScript) |
| **Styling** | CSS Modules + Framer Motion (animations) |
| **Backend** | Express.js + TypeScript (served via Bun) |
| **Database** | SQLite (using Drizzle ORM) |
| **Auth & Security** | JWT + HttpOnly Cookies + Role-based Middleware |
| **Mailing** | Nodemailer (temporary dummy sender for testing) |
| **Runtime** | Bun v1.2+ |
| **Package Manager** | Bun PM (ultra-fast install) |

---

## 📁 Project Structure

```
expert-feedback/
├── frontend/                # Next.js (CSR + SSR)
│   ├── pages/
│   │   ├── index.tsx        # Landing Page
│   │   ├── hr/login.tsx     # HR Login
│   │   ├── hr/register.tsx  # Role-based Registration
│   │   ├── hr/feedback-new.tsx # Create feedback & send token
│   │   └── feedback/[token].tsx # Token-based feedback view
│   ├── lib/
│   │   ├── auth.ts          # verifyAccess(), API utils
│   │   ├── UserContext.tsx  # Global user/session context
│   │   └── config.ts        # API_BASE and constants
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── Layout.tsx
│   ├── styles/
│   │   ├── Home.module.css
│   │   ├── Register.module.css
│   │   └── Navbar.module.css
│   └── package.json
│
├── backend/                 # Express + Drizzle (SQLite)
│   ├── src/
│   │   ├── server.ts        # App entry
│   │   ├── routes/
│   │   │   ├── auth.ts      # Register, Login, Logout
│   │   │   └── feedback.ts  # Feedback creation/view
│   │   ├── db/
│   │   │   ├── drizzle.ts   # DB initialization (sql.js)
│   │   │   └── schema.ts    # Tables: users, feedbacks
│   │   ├── middleware/
│   │   │   └── authorize.ts # Role-based protection
│   │   ├── utils/
│   │   │   ├── jwt.ts       # Sign/Verify JWT
│   │   │   └── mailer.ts    # Nodemailer setup
│   │   └── scripts/
│   │       └── seed-hr.ts   # Initial HR seed script
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## ⚙️ Environment Setup

### 1️⃣ Prerequisites
- [Bun](https://bun.sh/) v1.2 or higher
- Node v22 (optional, fallback)
- SQLite (pre-installed)

---

### 2️⃣ Install dependencies

```bash
# Frontend
cd frontend
bun install

# Backend
cd ../backend
bun install
```

---

### 3️⃣ Database setup (SQLite)

```bash
# Initialize and generate schema
bunx drizzle-kit generate
bunx drizzle-kit push

# or open Drizzle Studio (GUI)
bunx drizzle-kit studio
```

---

### 4️⃣ Configure Environment Variables (`.env`)

```bash
# backend/.env
DATABASE_URL=src/db/feedback.db
JWT_SECRET=supersecretjwt
SENDGRID_API_KEY=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
EMAIL_FROM="Feedify <feedback@resend.dev>"
FRONTEND_URL=http://localhost:3000
PORT=8000
RESEND_API_KEY=re_3vU8jAQi_7RkcTbQfEvX1GkDJY1SsiAZN
```

---

### 5️⃣ Run both servers (root)

```bash
bun run dev
```

This runs concurrently:
- **Backend** → http://localhost:8000  
- **Frontend** → http://localhost:3000  

---

## 🔐 Role-Based Access Control (RBAC)

| Role | Can Register | Can Create | Can View Feedback | Description |
|------|---------------|-------------|-------------------|-------------|
| **Admin** | ✅ All roles | ✅ All | ✅ All feedback | Superuser |
| **Manager** | ✅ HR, User | ✅ HR, User | ✅ Department feedback | Mid-level control |
| **HR** | ✅ User only | ✅ User feedback | ✅ Their created feedback | HR-level |
| **User** | ❌ | ❌ | ✅ via token only | External feedback participant |

Backend and frontend both enforce the same rule through:
- `authorize(["admin", "manager", "hr"])` middleware
- `useAuthGuard()` in frontend

---

## 🧩 Features Overview

### 🔑 Authentication
- Secure **JWT** issued on login
- Stored in **HttpOnly cookies**
- Auto-refresh via `UserContext`
- Logout clears all sessions

### 🧍‍♂️ Role-Based Access
- **Admin / Manager / HR / User**
- Protects both **frontend pages** and **API routes**

### 📨 Feedback Workflow
1. HR/Manager/Admin creates a feedback session.  
2. A **unique token** link is generated & sent via email.  
3. User opens `/feedback/view/[token]` to submit responses.  
4. Feedback stored securely with session + createdBy.

### 🌗 UI/UX
- Animated interface using **Framer Motion**
- Light/Dark theme support
- Responsive design (mobile-first)
- Token-based feedback view portal
- Professional illustrations & gradients

---

## 👨‍💻 Contributors

| Name | Role | Description |
|------|------|-------------|
| **Anil Sinthu** | Full-Stack Developer | Architecture, Implementation, Security |

---

> 💡 _“Expert Feedback System — simplifying feedback collection, securing roles, and improving decision efficiency.”_
