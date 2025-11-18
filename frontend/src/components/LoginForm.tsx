import { useState } from "react";
import { useAuth } from "../Context/AuthContext";

const API_BASE = "http://localhost:3000/api"; // backend base

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
    const { login } = useAuth();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
  
    async function handleRegister() {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          password,
          // only send if non-empty
          profile_pic_url: avatarUrl || undefined,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Register failed" }));
        throw new Error(error.message);
      }
    }
  
    return (
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          setLoading(true);
          try {
            if (mode === "register") {
              await handleRegister();
            }
            // ⚠️ On login we don't need avatarUrl; your AuthContext can fetch/set it after login if needed.
            await login({ name, password }); // ← remove avatarUrl here
            onSuccess?.();
          } catch (e: any) {
            setErr(e?.message || "Something went wrong");
          } finally {
            setLoading(false);
          }
        }}
      >
        {/* Toggle */}
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg px-3 py-1 ${mode === "login" ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-lg px-3 py-1 ${mode === "register" ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}
          >
            Register
          </button>
        </div>
  
        {err && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
  
        <div>
          <label className="mb-1 block text-sm font-medium">Display name</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
  
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>
  
        {/* 👇 Only show in register mode */}
        {mode === "register" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Avatar URL (optional)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/me.png"
            />
            {/* optional tiny preview */}
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt="avatar preview"
                className="mt-2 h-12 w-12 rounded-full border object-cover"
                onError={(e) => ((e.currentTarget.style.display = "none"))}
              />
            )}
          </div>
        )}
  
        <button
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading
            ? mode === "register" ? "Creating…" : "Signing in…"
            : mode === "register" ? "Create account" : "Continue"}
        </button>
  
        {mode === "register" && (
          <p className="text-xs text-neutral-500">
            (Dev build: passwords are plain on the server for now; we’ll hash later.)
          </p>
        )}
      </form>
    );
  }