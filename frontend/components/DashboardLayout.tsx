"use client";
import { API_BASE } from "@/lib/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaCog, FaHome, FaSignOutAlt, FaUser } from "react-icons/fa";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { push: navigate } = useRouter();
  const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) navigate("/login");
        else setUser(data.user);
      })
      .catch(() => navigate("/login"));
  }, []);

  if (!user) return <div className="text-center mt-5">Loading Dashboard...</div>;

  const handleLogout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    navigate("/login");
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside className="bg-primary text-white p-3" style={{ width: "250px" }}>
        <h4 className="mb-4 fw-bold">{user.role?.toUpperCase()} PANEL</h4>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <a className="nav-link text-white" href="/"><FaHome /> Home</a>
          </li>
          <li className="nav-item mb-2">
            <a className="nav-link text-white" href="/settings"><FaCog /> Settings</a>
          </li>
        </ul>
        <div className="mt-auto">
          <hr />
          <div className="d-flex align-items-center gap-2">
            <FaUser />
            <span>{user.name}</span>
          </div>
          <button className="btn btn-sm btn-light mt-3" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow-1 bg-light p-4">
        {children}
      </main>
    </div>
  );
}
