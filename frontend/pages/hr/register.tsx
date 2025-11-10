"use client";

import { API_BASE } from "@/lib/config";
import { useAuthGuard } from "@/lib/useAuthGuard";
import Router from "next/router";
import { useState } from "react";
import styles from "../../styles/Register.module.css";

const ROLES = ["admin", "manager", "hr", "user"];

export default function RegisterPage() {
  const { user, loading, unauthorized } = useAuthGuard(["admin", "manager", "hr"]);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  if (loading) return <div className={styles.loading}>🔍 Checking access...</div>;

  if (unauthorized)
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.formCard}>
          <h2 className={styles.heading}>🚫 Access Denied</h2>
          <p className={styles.error}>You are not authorized to view this page. Redirecting...</p>
        </div>
      </div>
    );

  if (!user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMsg("");

    try {
      // ✅ Debug: Confirm payload before sending
      console.log("Submitting registration:", form);

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log("Registration response:", data);

      if (!res.ok) {
        setMsg(`⚠️ ${data.error || "Registration failed"}`);
        return;
      }

      setMsg("✅ Registered successfully! Redirecting...");
      setTimeout(() => Router.push("/login"), 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setMsg(`❌ ${message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.formCard}>
        <h2 className={styles.heading}>Create New User</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <label htmlFor="role" className={styles.label}>
            Role
          </label>

          <select
            id="role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            required
            aria-label="Role"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>

          <button type="submit" disabled={sending}>
            {sending ? "Registering..." : "Register"}
          </button>
        </form>

        {msg && <p className={styles.message}>{msg}</p>}

        <p className={styles.footerText}>
          Already have an account?{" "}
          <span onClick={() => Router.push("/login")} className={styles.link}>
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}
