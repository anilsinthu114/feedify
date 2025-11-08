"use client";

import { verifyAccess } from "@/lib/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { API_BASE } from "./config";

interface User {
  id: number;
  role: string;
  name?: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with initial values
const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  refreshUser: async () => {},
  logout: async () => {},
});

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = async () => {
    const u = await verifyAccess();
    if (u) {
      setUser(u);
      sessionStorage.setItem("user", JSON.stringify(u));
    } else {
      setUser(null);
      sessionStorage.removeItem("user");
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.warn("Logout failed:", e);
    }
    setUser(null);
    sessionStorage.removeItem("user");
  };

  useEffect(() => {
    const cached = sessionStorage.getItem("user");
    if (cached) {
      setUser(JSON.parse(cached));
    } else {
      verifyAccess().then((u) => {
        if (u) {
          setUser(u);
          sessionStorage.setItem("user", JSON.stringify(u));
        }
      });
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}
