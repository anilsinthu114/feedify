"use client";

import { verifyAccess } from "@/lib/auth";
import { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  role: string;
  name?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user on mount (from sessionStorage or backend)
  useEffect(() => {
    const cached = sessionStorage.getItem("user");
    if (cached) setUser(JSON.parse(cached));
    else verifyAccess().then((u) => {
      if (u) {
        setUser(u);
        sessionStorage.setItem("user", JSON.stringify(u));
      }
    });
  }, []);

  async function refreshUser() {
    const u = await verifyAccess();
    if (u) {
      setUser(u);
      sessionStorage.setItem("user", JSON.stringify(u));
    } else {
      setUser(null);
      sessionStorage.removeItem("user");
    }
  }

  async function logout() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.warn("Logout failed:", e);
    }
    setUser(null);
    sessionStorage.removeItem("user");
  }

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}
