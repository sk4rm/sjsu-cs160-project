import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { LogOut, Pencil } from "lucide-react";

/** ---------- Types ---------- */
type User = {
  id: string;
  name: string;
  username?: string;
  handle?: string;
  school?: string;
  joinedAt?: string;
  bio?: string;
  avatarUrl?: string | null;
  points: number;
};

type Post = {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  alt?: string;
};

const API_BASE = "http://localhost:3000/api";

/** ---------- School options ---------- */
const SCHOOL_OPTIONS = [
  "San Jose State University",
  "UC Berkeley",
  "UC Davis",
  "UC Los Angeles",
  "UC San Diego",
  "UC Santa Barbara",
  "San Francisco State University",
  "Cal Poly San Luis Obispo",
  "Cal Poly Pomona",
  "Stanford University",
  "Santa Clara University",
];

/** ---------- Helpers ---------- */
function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** ---------- Edit types ---------- */
type EditValues = {
  avatarUrl: string;
  name: string;
  handle: string;
  school: string;
  bio: string;
};

type EditDialogProps = {
  open: boolean;
  onClose: () => void;
  initial: EditValues;
  saving: boolean;
  onSubmit: (values: EditValues) => Promise<void>;
};

function EditDialog({
  open,
  onClose,
  initial,
  saving,
  onSubmit,
}: EditDialogProps) {
  const [values, setValues] = useState<EditValues>(initial);

  useEffect(() => {
    if (open) setValues(initial);
  }, [open, initial]);

  if (!open) return null;

  function handleChange<K extends keyof EditValues>(
    key: K,
    value: EditValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(values);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Profile</h2>
          <button
            type="button"
            className="text-sm text-neutral-500 hover:text-neutral-800"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full bg-neutral-100">
              {values.avatarUrl ? (
                <img
                  src={values.avatarUrl}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
                  No photo
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-800">
                Profile picture
              </label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    handleChange("avatarUrl", "");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    handleChange("avatarUrl", dataUrl);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Upload a square image for best results.
              </p>
            </div>
          </div>

          {/* Name + Username */}
          <div className="grid grid-cols-[2fr,1.5fr] gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-800">
                Name
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={values.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-800">
                Username
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-neutral-200 pl-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <span className="text-sm text-neutral-500">@</span>
                <input
                  type="text"
                  className="w-full border-none bg-transparent px-2 py-2 text-sm focus:outline-none"
                  value={values.handle}
                  onChange={(e) =>
                    handleChange(
                      "handle",
                      e.target.value.replace(/[^a-zA-Z0-9_]/g, "")
                    )
                  }
                  placeholder="username"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Letters, numbers, and underscores. 3–20 characters.
              </p>
            </div>
          </div>

          {/* School */}
          <div>
            <label className="block text-sm font-medium text-neutral-800">
              School
            </label>
            <input
              type="text"
              list="school-options"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={values.school}
              onChange={(e) => handleChange("school", e.target.value)}
              placeholder="Your School"
            />
            <datalist id="school-options">
              {SCHOOL_OPTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-neutral-800">
              Bio
            </label>
            <textarea
              className="mt-1 w-full min-h-[80px] rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={values.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              maxLength={300}
              placeholder="Tell people a bit about you..."
            />
            <div className="mt-1 text-right text-xs text-neutral-500">
              {values.bio.length}/300
            </div>
          </div>

          {/* Footer buttons */}
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={classNames(
                "rounded-lg px-4 py-2 text-sm font-medium text-white",
                saving ? "bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
              )}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** ---------- Utils ---------- */
function formatJoined(dateISO?: string) {
  if (!dateISO) return "";
  const d = new Date(dateISO);
  const month = new Intl.DateTimeFormat("en", { month: "long" }).format(d);
  return `${month} ${d.getFullYear()}`;
}

/** ---------- Page ---------- */
export default function Profile() {
  const { user: authUser, logout } = useAuth();
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(authUser ?? null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Fetch fresh user + posts from backend using userId
  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (!authUser?.id) {
        setLoading(false);
        return;
      }

      try {
        const qs = `?userId=${encodeURIComponent(authUser.id)}`;
        const [uRes, pRes] = await Promise.all([
          fetch(`${API_BASE}/users/me${qs}`),
          fetch(`${API_BASE}/users/me/posts${qs}`),
        ]);

        const u = uRes.ok ? ((await uRes.json()) as User) : authUser;
        const p = pRes.ok ? ((await pRes.json()) as Post[]) : [];

        if (isMounted) {
          setUser(u || null);
          setPosts(p);
        }
      } catch {
        if (isMounted) {
          setUser(authUser ?? null);
          setPosts([]);
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
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }, [user?.name]);

  const displayName = user?.name ?? "";
  const displayHandle =
    user?.handle || (user?.username ? `@${user.username}` : undefined);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-40 w-full max-w-3xl animate-pulse rounded-2xl bg-neutral-100" />
        <div className="mt-6 grid grid-cols-[2fr,1fr] gap-6">
          <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-2xl bg-neutral-100" />
            <div className="h-10 animate-pulse rounded-2xl bg-neutral-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
          <h1 className="mb-3 text-xl font-semibold text-neutral-900">
            Sign in to view your profile
          </h1>
          <p className="mb-4 text-sm text-neutral-600">
            Your profile shows your posts, school, and Eco-Leveling stats.
          </p>
          <LoginForm onSuccess={() => nav(0)} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-sm text-neutral-500">
          Couldn&apos;t load your profile. Try refreshing the page.
        </p>
      </div>
    );
  }

  const editInitial: EditValues = {
    avatarUrl: user.avatarUrl || "",
    name: user.name,
    handle: (user.handle || "").replace(/^@/, ""),
    school: user.school || "",
    bio: user.bio || "",
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Profile</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Manage your Eco-Leveling presence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
              onClick={() => setEditOpen(true)}
            >
              <Pencil size={16} />
              Edit Profile
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              onClick={async () => {
                await logout();
                nav("/");
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr),minmax(0,1.2fr)]">
          {/* Left column */}
          <div className="space-y-4">
            {/* Profile card */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 to-emerald-300">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-emerald-900">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Name + bio */}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl font-semibold text-neutral-900">
                    {displayName || "Unnamed user"}
                  </h2>
                  {displayHandle && (
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {displayHandle}
                    </p>
                  )}
                  {user.school && (
                    <p className="mt-1 text-sm text-neutral-600">
                      🎓 {user.school}
                    </p>
                  )}
                  {user.bio && (
                    <p className="mt-2 line-clamp-3 text-sm text-neutral-700">
                      {user.bio}
                    </p>
                  )}
                  {user.joinedAt && (
                    <p className="mt-2 text-xs text-neutral-400">
                      Joined {formatJoined(user.joinedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-neutral-50 p-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Posts
                  </p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">
                    {posts.length}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Points
                  </p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">
                    {user.points ?? 0}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Level
                  </p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">
                    {Math.floor((user.points ?? 0) / 100) + 1}
                  </p>
                </div>
              </div>
            </section>

            {/* Posts grid */}
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Posts
                </h3>
                <p className="text-xs text-neutral-500">
                  {posts.length === 0
                    ? "No posts yet"
                    : `${posts.length} post${posts.length === 1 ? "" : "s"}`}
                </p>
              </div>

              {posts.length === 0 ? (
                <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                  Your posts will appear here.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-100"
                    >
                      {post.mediaType === "video" ? (
                        <video
                          src={post.mediaUrl}
                          className="h-full w-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt={post.alt || "Post"}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      )}

                      {post.alt && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                          <p className="line-clamp-2">{post.alt}</p>
                        </div>
                      )}

                      {post.mediaType === "video" && (
                        <div className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Video
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column */}
          <aside className="space-y-4">
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-900">
                Quick actions
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-left text-neutral-800 hover:bg-neutral-50"
                >
                  Edit profile details
                </button>
                <button
                  type="button"
                  onClick={() => nav("/upload")}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-left text-neutral-800 hover:bg-neutral-50"
                >
                  Upload a new post
                </button>
                <button
                  type="button"
                  onClick={() => nav("/settings")}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-left text-neutral-800 hover:bg-neutral-50"
                >
                  Account & app settings
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-900">
                Eco-Leveling tips
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-neutral-600">
                <li>Share before/after photos of clean-ups or recycling.</li>
                <li>Add detailed descriptions so others can learn from you.</li>
                <li>Tag your posts clearly so moderators can award points.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>

      {/* Edit dialog */}
      <EditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editInitial}
        saving={saving}
        onSubmit={async (values) => {
          if (!user || !authUser?.id) return;

          const payload: Record<string, string> = {
            userId: authUser.id,
          };

          if (values.name !== (user.name || "")) {
            payload.name = values.name.trim();
          }

          const normalizedHandle = values.handle.trim();
          const currentHandle = (user.handle || "").replace(/^@/, "");
          if (normalizedHandle && normalizedHandle !== currentHandle) {
            payload.username = normalizedHandle;
          }

          if (values.school !== (user.school || "")) {
            payload.school = values.school.trim();
          }

          if (values.bio !== (user.bio || "")) {
            payload.bio = values.bio;
          }

          if ((values.avatarUrl || "") !== (user.avatarUrl || "")) {
            payload.avatarUrl = values.avatarUrl;
          }

          if (Object.keys(payload).length === 1) {
            // only userId, nothing else changed
            setEditOpen(false);
            return;
          }

          setSaving(true);
          try {
            const res = await fetch(`${API_BASE}/users/me`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              if (res.status === 409)
                throw new Error("That username is already taken.");
              const err = await res.json().catch(() => ({}));
              throw new Error(err?.message || "Failed to update profile");
            }

            const updated = (await res.json()) as User;
            setUser(updated);
            setEditOpen(false);
          } catch (e: any) {
            alert(e?.message || "Update failed");
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
