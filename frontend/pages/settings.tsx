"use client";

import { useUser } from "@/lib/UserContext";
import styles from "@/styles/Settings.module.css";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (!user || !["admin", "hr", "manager"].includes(user.role)) {
      toast.error("You are not authorized to access Settings.");
      return;
    }
  }, [user, router]);

  if (!mounted || !user) return <p className={styles.loading}>Loading...</p>;

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.card}>
        <h2 className={styles.heading}>⚙️ Settings</h2>
        <p>Welcome, {user.name}!</p>

        <div className={styles.options}>
          <button
            onClick={() => {
              toast("Navigating to Create User...");
              router.push("/hr/register");
            }}
          >
            ➕ Create New User
          </button>

          <button
            onClick={() => {
              toast.success("Opening Feedback Form");
              router.push("/hr/feedback-new");
            }}
          >
            📝 Create Feedback
          </button>

          <button
            onClick={() => {
              toast("Fetching Feedback Records...");
              router.push("/hr/feedback-view");
            }}
          >
            📋 View All Feedback
          </button>
        </div>
      </div>
      <div className={styles.note}>
        * Only users with roles Admin, HR, or Manager can access these settings.
      </div>
    </motion.div>
  );
}
