// src/pages/dashboard/user.tsx
import DashboardLayout from "@/components/DashboardLayout";
import { API_BASE } from "@/lib/config";
import { useTheme } from "@/lib/ThemeContext";
import { useEffect, useState } from "react";

export default function UserDashboard() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetch(`${API_BASE}/api/dashboard`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFeedback(d.data.myFeedback || []));
  }, []);

  return (
    <DashboardLayout>
      <h1>Your Feedback</h1>
      <p className="text-muted">View your personal feedback and comments.</p>

      <div className="card mt-4 shadow-sm">
        <div className="card-body">
          <table className="table table-bordered mt-3">
            <thead><tr><th>Session</th><th>Observations</th><th>Recommendations</th><th>Rating</th></tr></thead>
            <tbody>
              {feedback.map((f) => (
                <tr key={f.id}>
                  <td>{f.sessionAt}</td>
                  <td>{f.observations}</td>
                  <td>{f.recommendations}</td>
                  <td>{f.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
