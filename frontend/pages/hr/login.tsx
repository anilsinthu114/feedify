"use client";

import { API_BASE } from "@/lib/config";
import { useUser } from "@/lib/UserContext";
import { motion } from "framer-motion";
import Router from "next/router";
import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "../../styles/Login.module.css";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { refreshUser } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Login failed");
        return;
      }
      setMsg("Login successful! Redirecting...");
      await refreshUser();
      setTimeout(() => Router.push("/hr/feedback-new"), 700);
    } catch (error) {
      setMsg("An error occurred during login");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className={styles.loginContainer}>
      <motion.div
        className={styles.loginCard}
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className={styles.title}>HR Login</h1>

        <form onSubmit={submit} className={styles.form}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@company.com"
            required
            disabled={loading}
          />

          <label htmlFor="password">Password</label>
          <div className={styles.passwordField}>
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className={styles.forgot}>
            <a href="/forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {msg && (
          <motion.div
            className={`${styles.message} ${
              msg.toLowerCase().includes("success")
                ? styles.success
                : styles.error
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {msg}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
