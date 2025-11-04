"use client";

import {
    logout,
    verifyAccess
} from "@/lib/auth";
import styles from "@/styles/Settings.module.css";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    async function init() {
      const data = await verifyAccess();
      if (!data || !["admin", "hr", "manager"].includes(data.role)) {
        toast.error("You are not authorized to access Settings.");
        router.push("/404");
        return;
      }
      setUser(data);
    }
    init();
  }, [router]);

  if (!user) return <p className={styles.loading}>Loading...</p>;

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
        <div >
            <button
              className={styles.btn}
              onClick={() => {
                logout();
                toast.success("Logged out successfully!");
                setTimeout(() => router.push("/"), 800);
              }}
            >
              Logout
            </button>
            </div>
        </div>
        <div className={styles.note}>
          * Only users with roles Admin, HR, or Manager can access these settings.
        </div>
    </motion.div>
  );
}
