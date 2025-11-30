import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext";

function isHex24(s: string) {
  return /^[a-fA-F0-9]{24}$/.test(s);
}

type ProfileUser = {
  id: string;
  name: string;
  username?: string;
  handle?: string;
};

export default function Upload() {
  const { user } = useAuth(); // logged-in user (or null)

  const [authorId, setAuthorId] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);

  // Prefer authUser.id for authorId; fall back to /api/auth/me
  useEffect(() => {
    (async () => {
      if (user?.id && isHex24(user.id)) {
        setAuthorId(user.id);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return;
        const me = await res.json();
        if (me?._id && isHex24(me._id)) setAuthorId(me._id);
      } catch {
        /* ignore */
      }
    })();
  }, [user?.id]);

  // Fetch fresh profile so "Posting as" shows latest name
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user?.id) {
        setProfileUser(null);
        return;
      }
      try {
        const res = await fetch(
          `/api/users/me?userId=${encodeURIComponent(user.id)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setProfileUser({
          id: data.id,
          name: data.name ?? "",
          username: data.username ?? undefined,
          handle: data.handle ?? undefined,
        });
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const postingName =
    profileUser?.handle ||
    profileUser?.username ||
    profileUser?.name ||
    user?.name ||
    "user";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedId(null);

    if (authorId && !isHex24(authorId)) {
      setError("author_id must be a 24-hex MongoDB ObjectId string.");
      return;
    }

    if (!body.trim()) {
      setError("Post text is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          author_id: authorId || undefined,
          // if logged in, use checkbox; if not logged in, always anonymous
          anonymous: user ? anonymous : true,
          body: body.trim(),
          image_url: imageUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Request failed (${res.status})`);
      }

      const json = await res.json(); // { id } or { insertedId }
      const id = json?.insertedId || json?.id || null;

      setCreatedId(id);
      setBody("");
      setImageUrl("");
      setAnonymous(false);
    } catch (err: any) {
      setError(err?.message || "Failed to create post.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Upload</h1>

      <div className="mx-auto max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Author ID (MongoDB ObjectId)
            </label>
            <input
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              placeholder="(auto-filled if logged in)"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-500"
              disabled={!!user?.id}
            />
            {!authorId || isHex24(authorId) ? null : (
              <p className="mt-1 text-sm text-red-600">
                Must be a 24-hex ObjectId.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Image URL (optional)
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-500"
            />
            {imageUrl.trim() ? (
              <div className="mt-3">
                <img
                  src={imageUrl}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                  className="max-h-64 rounded-lg border border-neutral-200 object-cover"
                  alt="preview"
                />
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Post text
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Say something…"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-500"
            />
          </div>

          {/* Anonymous toggle */}
          <div className="flex flex-col gap-1 text-sm">
            {user ? (
              <label className="flex items-center gap-2 text-neutral-700">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <span>Post anonymously</span>
                <span className="text-xs text-neutral-500">
                  {anonymous
                    ? "Your name will not be shown on this post."
                    : `Posting as ${postingName}.`}
                </span>
              </label>
            ) : (
              <p className="text-xs text-neutral-500">
                You’re not logged in, so this post will be anonymous.
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {createdId && (
            <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
              Post created! ID: <code>{createdId}</code>. It will appear on Home.
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create Post"}
            </button>
            <button
              type="button"
              onClick={() => {
                setBody("");
                setImageUrl("");
                setAnonymous(false);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
