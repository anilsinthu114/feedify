import { API_BASE } from "./config";

export async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}


export async function verifyAccess(roles: string[] = []) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: "include",
    });

    if (!res.ok) {
      console.warn("verifyAccess: /api/auth/me not ok");
      return null;
    }

    const data = await res.json();
    if (!data.user) {
      console.warn("verifyAccess: no user found in response");
      return null;
    }

    const userRole = data.user.role;
    
    if (roles.length === 0) return data.user;

    if (roles.includes(userRole)) return data.user;

    console.warn(`verifyAccess: user role ${userRole} not in allowed ${roles.join(", ")}`);
    return null;
  } catch (err) {
    console.error("verifyAccess error:", err);
    return null;
  }
}


export async function logout() {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}