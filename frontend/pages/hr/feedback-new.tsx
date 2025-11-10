import { checkAuth } from "@/lib/auth";
import { API_BASE } from "@/lib/config";
import Router from "next/router";
import { useEffect, useState } from "react";
import styles from "../../styles/FeedbackNew.module.css";

export default function FeedbackNew() {
  const [auth, setAuth] = useState(false);
  const [form, setForm] = useState({
    userName: "",
    userEmail: "",
    sessionAt: "",
    observations: "",
    recommendations: "",
    rating: 5,
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    checkAuth().then((ok) => {
      if (!ok) Router.push("/login");
      else setAuth(true);
    });
  }, []);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setMsg("Sending...");
    const res = await fetch(`${API_BASE}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || "Failed ❌");
    setMsg("✅ Feedback sent successfully!");
  }

  if (!auth) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.formCard}>
        <h2 className={styles.heading}>Submit Feedback</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            placeholder="Client Name"
            type="text"
            title="name"
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            required
          />
          <input
          title="email"
            placeholder="Client Email"
            type="email"
            onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
            required
          />
          <input
          title="date"
            type="datetime-local"
            onChange={(e) => setForm({ ...form, sessionAt: e.target.value })}
            required
          />
          <textarea
            placeholder="Observations"
            onChange={(e) => setForm({ ...form, observations: e.target.value })}
          />
          <textarea
            placeholder="Recommendations"
            onChange={(e) =>
              setForm({ ...form, recommendations: e.target.value })
            }
          />
          <input
          title="rating"
            type="number"
            min="1"
            max="5"
            onChange={(e) =>
              setForm({ ...form, rating: Number(e.target.value) })
            }
            defaultValue={form.rating}
          />
          <button type="submit">Send Feedback</button>
        </form>
        {msg && <p className={styles.message}>{msg}</p>}
      </div>
    </div>
  );
}
