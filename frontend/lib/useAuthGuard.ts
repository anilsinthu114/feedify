import Router from "next/router";
import { useEffect, useState } from "react";
import { API_BASE } from "./config";

type UserPayload = {
  sub: number;
  role: string;
  name?: string;
};

export function useAuthGuard(allowedRoles: string[]) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!data.ok || !allowedRoles.includes(data.user.role)) {
          setUnauthorized(true);
          setTimeout(() => Router.replace("/"), 2000);
        } else {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setUnauthorized(true);
        setTimeout(() => Router.replace("/"), 2000);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [allowedRoles]);

  return { user, loading, unauthorized };
}
