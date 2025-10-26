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
    // hit backend register, then auto-login
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password, profile_pic_url: avatarUrl || undefined })
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.error || "Register failed";
      throw new Error(msg);
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
          // always go through login so AuthContext sets user/localStorage
          await login({ name, password, avatarUrl });
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

      {err && <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      <div>
        <label className="mb-1 block text-sm font-medium">Display name</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
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
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Avatar URL (optional)</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
      </div>

      <button
        disabled={loading}
        className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? (mode === "register" ? "Creating…" : "Signing in…") : (mode === "register" ? "Create account" : "Continue")}
      </button>

      {mode === "register" && (
        <p className="text-xs text-neutral-500">
          (Dev build: passwords are plain on the server for now; we’ll hash later.)
        </p>
      )}
    </form>
  );
}
