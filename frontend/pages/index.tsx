"use client";

import styles from "@/styles/Home.module.css";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.setAttribute("data-theme", savedTheme);
    }
  }, []);

  // Apply theme to <body> and persist choice
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.body.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("⚠️ Please enter your feedback token.");
      return;
    }
    router.push(`/feedback/view/${token.trim()}`);
  };

  return (
    <motion.div
      className={styles.pageWrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.button
        className={styles.themeToggle}
        onClick={toggleTheme}
        whileTap={{ rotate: 90 }}
        aria-label="Toggle theme"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </motion.button>

      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className={styles.title}>🧠 Feedify - An Expert Feedback System</h1>
          <p className={styles.subtitle}>
            Collect, manage, and review expert feedback — securely, efficiently,
            and with ease.
          </p>

          <div className={styles.buttons}>
            <Link href="/login" className={styles.primaryBtn}>
              🔑 Login to Dashboard
            </Link>

            <motion.button
              className={styles.secondaryBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowTokenInput(true)}
            >
              🔗 Open Feedback Link
            </motion.button>
          </div>

          {/* Token Box */}
          {showTokenInput && (
            <motion.div
              className={styles.tokenBox}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleTokenSubmit} className={styles.tokenForm}>
                <input
                  type="text"
                  placeholder="Enter your feedback token"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    setError("");
                  }}
                  className={styles.tokenInput}
                  autoFocus
                />
                <motion.button
                  type="submit"
                  className={styles.tokenSubmit}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Feedback
                </motion.button>
              </form>
              {error && <p className={styles.error}>{error}</p>}
            </motion.div>
          )}
        </motion.div>

        {/* Illustration */}
        <motion.div
          className={styles.illustration}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <Image
            src="/illustration-feedback.svg"
            alt="Feedback illustration"
            width={520}
            height={420}
            priority
          />
        </motion.div>
      </section>
    </motion.div>
  );
}
