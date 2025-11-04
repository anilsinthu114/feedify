"use client";

import { verifyAccess } from "@/lib/auth";
import styles from "@/styles/Profile.module.css";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      const data = await verifyAccess();
      if (!data) {
        toast.error("Please log in to access your profile.");
        router.push("/hr/login");
        return;
      }
      setUser(data);
    }
    loadUser();
  }, [router]);

  if (!user) return <p className={styles.loading}>Loading...</p>;

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
        <p><strong>Role:</strong> {user.role.toUpperCase()}</p>

        <button
          className={styles.btn}
          onClick={() => {
            toast.success("Logged out successfully!");
            setTimeout(() => router.push("/"), 800);
          }}
        >
          Logout
        </button>
      </div>
    </motion.div>
  );
}
