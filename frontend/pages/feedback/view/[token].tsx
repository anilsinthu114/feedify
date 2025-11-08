"use client";
import { API_BASE } from "@/lib/config";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "../../../styles/Form.module.css";

interface Feedback {
  userName: string;
  userEmail: string;
  sessionAt: string;
  observations?: string;
  recommendations?: string;
  rating?: number;
  createdAt: string;
}

export default function FeedbackTokenView() {
  const router = useRouter();
  const { token } = router.query;
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/feedback/view/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setFeedback(data.feedback);
        else setError(data.error || "Invalid or expired link");
      })
      .catch(() => setError("Server error"));
  }, [token]);

  if (error)
    return (
      <div className={styles.pageWrapper}>
        <div className={`${styles.formCard} ${styles.feedbackForm}`}>
          <h2 className={styles.heading}>Feedback Unavailable</h2>
          <p className={styles.error}>{error}</p>
        </div>
      </div>
    );

  if (!feedback)
    return (
      <div className={styles.pageWrapper}>
        <p className={styles.loading}>Loading feedback...</p>
      </div>
    );

  return (
    <div className={styles.pageWrapper}>
      <div className={`${styles.formCard} ${styles.feedbackForm}`}>
        <h2 className={styles.heading}>Feedback Summary</h2>
        <p><strong>Name:</strong> {feedback.userName}</p>
        <p><strong>Email:</strong> {feedback.userEmail}</p>
        <p><strong>Session At:</strong> {new Date(feedback.sessionAt).toLocaleString()}</p>
        <p><strong>Observations:</strong> {feedback.observations || "—"}</p>
        <p><strong>Recommendations:</strong> {feedback.recommendations || "—"}</p>
        <p><strong>Rating:</strong> ⭐ {feedback.rating ?? "N/A"}</p>
        <p className={styles.p}>
          Created on: {new Date(feedback.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
