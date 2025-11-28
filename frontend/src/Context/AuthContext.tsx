import { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  /** Display name – for now we make this the username by default */
  name: string;
  /** Username/handle, like "@emmawilson" */
  handle?: string;
  avatarUrl?: string;
  isModerator: boolean;
};

type LoginInput = {
  // This is the username the user types in (you were calling it `name` before)
  name: string;
  password: string;
  avatarUrl?: string;
};

type AuthContextType = {
  user: User | null;
  login: (u: LoginInput) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "http://localhost:3000/api";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<User>;
        if (parsed && parsed.id && parsed.name) {
          const username = parsed.name.trim();
          const hydrated: User = {
            id: parsed.id,
            name: username,
            handle: parsed.handle ?? (username ? `@${username}` : undefined),
            avatarUrl: parsed.avatarUrl ?? "",
            isModerator: !!parsed.isModerator, // default false if missing
          };
          setUser(hydrated);
        }
      }
    } catch {
      // ignore parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (u: LoginInput) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: u.name, password: u.password }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const raw = await res.json(); // could be { ... } or { user: {...} }
      // If backend returns { user: {...}, token: "..." }, grab user
      const data = (
        raw && typeof raw === "object" && "user" in raw ? raw.user : raw
      ) as {
        id?: string;
        _id?: string;
        name?: string | null;
        username?: string | null;
        handle?: string | null;
        profile_pic_url?: string | null;
        is_moderator?: boolean | null;
        isModerator?: boolean | null;
      };

      const usernameRaw =
        data.username ??
        (data.handle ? data.handle.replace(/^@/, "") : undefined) ??
        data.name ??
        u.name;

      const username = (usernameRaw || "").trim();
      const displayName = username;

      const isModerator = Boolean(
        data.is_moderator ?? data.isModerator ?? false
      );

      const newUser: User = {
        id: (data.id ?? data._id)!,
        name: displayName,
        handle: username ? `@${username}` : undefined,
        avatarUrl: data.profile_pic_url ?? u.avatarUrl ?? "",
        isModerator,
      };

      setUser(newUser);
      localStorage.setItem("auth_user", JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    // optionally also call /api/auth/logout when you add it
  };

  const value = useMemo(
    () => ({ user, login, logout, loading }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

