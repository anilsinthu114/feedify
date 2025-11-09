import DashboardLayout from "@/components/DashboardLayout";
import { API_BASE } from "@/lib/config";
import { useEffect, useState } from "react";

export default function HrDashboard() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/dashboard`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFeedbacks(d.data.feedbacks));
  }, []);

  return (
    <DashboardLayout>
      <h1>HR Dashboard</h1>
      <p className="text-muted">Create, manage, and review feedback sessions.</p>

      <div className="card mt-4 shadow-sm">
        <div className="card-body">
          <h5>Feedback Records ({feedbacks?.length || 0})</h5>
          <table className="table table-hover mt-3">
            <thead><tr><th>User</th><th>Session</th><th>Rating</th><th>Token</th></tr></thead>
            <tbody>
              {feedbacks.map((f) => (
                <tr key={f.id}><td>{f.userName}</td><td>{f.sessionAt}</td><td>{f.rating}</td><td>{f.secureToken}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
