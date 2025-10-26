import { useAuth } from "../Context/AuthContext";
import LoginForm from "../components/LoginForm";
import { useNavigate, useLocation } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const next = new URLSearchParams(loc.search).get("next");

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">👤 Profile</h1>
        <p className="text-neutral-600">You’re not logged in.</p>
        <div className="mt-6 max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <LoginForm onSuccess={() => next && nav(next, { replace: true })} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">👤 Profile</h1>

      {/* avatar + name + logout */}
      <div className="mt-6 flex max-w-xl items-center gap-4 rounded-2xl border bg-white p-6 shadow-sm">
        <img
          src={
            user.avatarUrl ||
            `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(user.name)}`
          }
          className="h-16 w-16 rounded-full ring-2 ring-blue-100"
          alt="avatar"
        />
        <div className="flex-1">
          <div className="text-xl font-semibold">{user.name}</div>
          <div className="text-sm text-neutral-500">Signed in (local)</div>
        </div>
        <button
          onClick={logout}
          className="rounded-xl border px-4 py-2 hover:bg-neutral-50"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
