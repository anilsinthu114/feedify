"use client";

import { useUser } from "@/lib/UserContext";
import styles from "@/styles/ProfilePage.module.css";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (!user) {
      toast.error("Please log in to access your profile.");
      router.push("/login");
      return;
    }
  }, [user, router]);

  if (!mounted || !user) return <p className={styles.loading}>Loading...</p>;

  const handleLogout = async (): Promise<void> => {
    await logout();
    toast.success("Logged out successfully!");
    setTimeout(() => router.push("/"), 800);
  }

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.card}>
        <h2 className={styles.heading}>👤 My Profile</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <button
          className={styles.btn}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </motion.div>
  );
}
