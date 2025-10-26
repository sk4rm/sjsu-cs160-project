import { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = { id: string; name: string; avatarUrl?: string };

type LoginInput = { name: string; password: string; avatarUrl?: string }; // ✅ new

type AuthContextType = {
  user: User | null;
  login: (u: LoginInput) => Promise<void>;  // ✅ now async and includes password
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "http://localhost:3000/api"; // ✅ backend base

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // hydrate from localStorage to keep current UX
  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const login = async (u: LoginInput) => {
    // call backend (plain password for now)
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: u.name, password: u.password })
    });

    if (!res.ok) {
      throw new Error("Invalid credentials");
    }

    // backend returns: { id, name, profile_pic_url }
    const data: { id: string; name: string; profile_pic_url?: string | null } = await res.json();

    const newUser: User = {
      id: data.id,
      name: data.name,
      avatarUrl: data.profile_pic_url ?? u.avatarUrl ?? ""
    };

    setUser(newUser);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    // (optional) also POST to /api/auth/logout when you add it server-side
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
