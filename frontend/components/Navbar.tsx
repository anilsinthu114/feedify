"use client";

import { useUser } from "@/lib/UserContext";
import styles from "@/styles/Navbar.module.css";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, logout } = useUser();
  const router = useRouter();

  const isPrivileged = ["admin", "hr", "manager"].includes(user?.role || "");

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/");
  };

  return (
    <motion.nav
      className={styles.navbar}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo}>
          🧠 Expert Feedback System
        </Link>

        <ul className={styles.navLinks}>
          <li>
            <Link href="/" className={styles.link}>
              Home
            </Link>
          </li>

          {user && (
            <li>
              <Link href="/profile" className={styles.link}>
                Profile
              </Link>
            </li>
          )}

          {isPrivileged && (
            <>
              <li>
                <Link href="/hr/feedback-new" className={styles.link}>
                  Create Feedback
                </Link>
              </li>
              <li>
                <Link href="/hr/settings" className={styles.link}>
                  Settings
                </Link>
              </li>
            </>
          )}

          {user ? (
            <li>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Logout ({user.role})
              </button>
            </li>
          ) : (
            <li>
              <Link href="/login" className={styles.link}>
                Login
              </Link>
            </li>
          )}
        </ul>
      </div>
    </motion.nav>
  );
}
