import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";       
import LoginForm from "../components/LoginForm";
import { LogOut, Pencil } from 'lucide-react';    

/** ---------- Types ---------- */
type User = {
  id: string;
  name: string;
  handle?: string; // e.g. "@emmawilson_photos"
  school?: string; // e.g. "University of Washington"
  joinedAt?: string; // ISO date
  bio?: string;
  avatarUrl?: string | null;
  stats?: {
    posts: number;
    totalLikes: number;
    comments: number;
  };
};

type Post = {
  id: string;
  imageUrl: string;
  alt?: string;
};

const API_BASE = "http://localhost:3000/api";

/** ---------- Utilities ---------- */
function formatJoined(dateISO?: string) {
  if (!dateISO) return "";
  const d = new Date(dateISO);
  const month = new Intl.DateTimeFormat("en", { month: "long" }).format(d);
  return `${month} ${d.getFullYear()}`;
}

/** ---------- Page ---------- */
export default function Profile() {
  const { user: authUser, logout } = useAuth();
  const nav = useNavigate();                                         // ✅ added
  const [user, setUser] = useState<User | null>(authUser ?? null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editBio, setEditBio] = useState("");

  // Fetch fresh user + posts
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          fetch(`${API_BASE}/users/me`, { credentials: "include" }),
          fetch(`${API_BASE}/users/me/posts`, { credentials: "include" }),
        ]);
        const u = uRes.ok ? ((await uRes.json()) as User) : authUser;
        const p = pRes.ok ? ((await pRes.json()) as Post[]) : [];
        if (isMounted) {
          setUser(u || null);
          setPosts(p);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [authUser]);

  const initials = useMemo(() => {
    if (!user?.name) return "?";
    const parts = user.name.trim().split(/\s+/);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  }, [user?.name]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-40 w-full max-w-3xl animate-pulse rounded-2xl bg-neutral-100" />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  // ✅ show LoginForm when logged out
  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-2 text-neutral-600">You need to log in to view this page.</p>

        <div className="mt-6 max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <LoginForm onSuccess={() => nav("/profile", { replace: true })} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Card */}
      <div className="max-w-4xl rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-neutral-100 ring-2 ring-neutral-200">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-neutral-500">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-xl font-semibold">{user.name}</div>
                {user.handle && <div className="truncate text-neutral-500">{user.handle}</div>}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                  {user.school && (
                    <span className="inline-flex items-center gap-1">
                      <span className="i-lucide-graduation-cap" />
                      {user.school}
                    </span>
                  )}
                  {user.joinedAt && (
                    <span className="inline-flex items-center gap-1">
                      <span className="i-lucide-calendar" />
                      Joined {formatJoined(user.joinedAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditBio(user.bio || "");
                    setEditOpen(true);
                  }}
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  {<Pencil className="h-4 w-4" />}
                  Edit Profile
                </button>
                <button
                  onClick={async () => {
                    await logout();                              // ✅ clear auth
                    nav("/profile", { replace: true });          // ✅ show LoginForm
                  }}
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  {<LogOut className="h-4 w-4" />}
                  Sign Out
                </button>
              </div>
            </div>

            {/* Bio */}
            <p className="mt-3 max-w-2xl whitespace-pre-wrap text-neutral-800">
              {user.bio || " "}
            </p>

            {/* Stats */}
            <div className="mt-4 flex gap-8 text-sm">
              <Stat label="Posts" value={user.stats?.posts ?? posts.length} />
              <Stat label="Total Likes" value={user.stats?.totalLikes ?? 0} />
              <Stat label="Comments" value={user.stats?.comments ?? 0} />
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mt-8 flex items-center gap-2">
        <h2 className="text-lg font-semibold">Posts</h2>
        <span className="rounded-full bg-neutral-100 px-2 text-sm text-neutral-600">
          {(user.stats?.posts ?? posts.length) || 0}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.length === 0 ? (
          <EmptyPosts />
        ) : (
          posts.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <img src={p.imageUrl} alt={p.alt || ""} className="h-56 w-full object-cover" loading="lazy" />
            </div>
          ))
        )}
      </div>

      {/* Edit Profile Dialog (unchanged) */}
      {editOpen && user && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => !saving && setEditOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Edit Profile</h3>
              <p className="text-sm text-neutral-500">Update your profile details.</p>
            </div>

            <EditForm
              initial={{
                name: user.name || "",
                handle: user.handle?.replace(/^@/, "") || "",
                school: user.school || "",
                location: (user as any).location || "",
                bio: user.bio || "",
              }}
              saving={saving}
              onCancel={() => setEditOpen(false)}
              onSave={async (values) => {
                const payload: Record<string, string> = {};
                if (values.name !== (user.name || "")) payload.name = values.name.trim();
                const normalizedHandle = values.handle.trim();
                const currentHandle = (user.handle || "").replace(/^@/, "");
                if (normalizedHandle !== currentHandle) payload.username = normalizedHandle;
                if (values.school !== (user.school || "")) payload.school = values.school.trim();
                if (values.location !== ((user as any).location || "")) payload.location = values.location.trim();
                if (values.bio !== (user.bio || "")) payload.bio = values.bio;

                if (Object.keys(payload).length === 0) {
                  setEditOpen(false);
                  return;
                }

                setSaving(true);
                try {
                  const res = await fetch(`${API_BASE}/users/me`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) {
                    if (res.status === 409) throw new Error("That username is already taken.");
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err?.message || "Failed to update profile");
                  }
                  setUser((u) =>
                    u
                      ? {
                          ...u,
                          name: payload.name ?? u.name,
                          handle: payload.username !== undefined ? `@${payload.username}` : u.handle,
                          school: payload.school ?? u.school,
                          bio: payload.bio ?? u.bio,
                          ...(payload.location !== undefined ? { location: payload.location } : {}),
                        }
                      : u
                  );
                  setEditOpen(false);
                } catch (e: any) {
                  alert(e?.message || "Update failed");
                } finally {
                  setSaving(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** ---------- Small bits ---------- */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-base font-semibold">{value}</div>
      <div className="text-neutral-500">{label}</div>
    </div>
  );
}

function EmptyPosts() {
  return (
    <div className="col-span-full">
      <div className="flex h-40 items-center justify-center rounded-2xl border bg-white text-neutral-500">
        No posts yet.
      </div>
    </div>
  );
}


function EditForm({
  initial,
  saving,
  onCancel,
  onSave,
}: {
  initial: { name: string; handle: string; school: string; location: string; bio: string };
  saving: boolean;
  onCancel: () => void;
  onSave: (values: { name: string; handle: string; school: string; location: string; bio: string }) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [handle, setHandle] = useState(initial.handle);
  const [school, setSchool] = useState(initial.school);
  const [location, setLocation] = useState(initial.location);
  const [bio, setBio] = useState(initial.bio);
  const [err, setErr] = useState<string | null>(null);

  function validate() {
    // username: 3–20, letters/numbers/underscore only
    if (handle && !/^[a-zA-Z0-9_]{3,20}$/.test(handle)) {
      return "Username must be 3–20 characters (letters, numbers, underscore).";
    }
    if (name.trim().length === 0) {
      return "Name is required.";
    }
    return null;
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const v = validate();
        if (v) {
          setErr(v);
          return;
        }
        setErr(null);
        onSave({ name: name.trim(), handle: handle.trim(), school: school.trim(), location: location.trim(), bio });
      }}
    >
      {err && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Username</label>
          <div className="flex items-center">
            <span className="rounded-l-xl border border-r-0 bg-neutral-50 px-3 py-2 text-neutral-500">@</span>
            <input
              className="w-full rounded-r-xl border px-3 py-2"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="emmawilson_photos"
              maxLength={20}
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Letters, numbers, and underscores. 3–20 characters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">School</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="University of Washington"
            maxLength={80}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Location</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Seattle, WA"
            maxLength={80}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Bio</label>
        <textarea
          className="h-28 w-full resize-none rounded-xl border px-3 py-2"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          placeholder="Tell people a bit about you…"
        />
        <div className="mt-1 text-right text-xs text-neutral-500">{bio.length}/300</div>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

