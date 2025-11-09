import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setNewName(d.user.name);
        }
      });
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Saving...");
    const res = await fetch("/api/user/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Profile updated ✅" : data.error || "Update failed");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Updating password...");
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Password updated ✅" : data.error || "Error updating password");
  }

  if (!user) return <p>Loading user info...</p>;

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto" }}>
      <h2>User Settings</h2>
      <form onSubmit={handleUpdate}>
        <label>Name</label>
        <input  title="Name"
         value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button type="submit">Save Name</button>
      </form>
      <form onSubmit={handleChangePassword} style={{ marginTop: "1.5rem" }}>
        <label>New Password</label>
        <input
title="New Password"
type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button type="submit">Change Password</button>
      </form>
      <p>{msg}</p>
    </div>
  );
}
