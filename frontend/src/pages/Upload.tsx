// frontend/src/pages/Upload.tsx
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

type MediaKind = "image" | "video" | null;

export default function Upload() {
  const { user } = useAuth(); // logged-in user (or null)

  const [authorId, setAuthorId] = useState("");
  const [body, setBody] = useState("");
  const [mediaDataUrl, setMediaDataUrl] = useState(""); // image or video as Data URL
  const [mediaKind, setMediaKind] = useState<MediaKind>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);

  // key used to force-reset the file input
  const [fileKey, setFileKey] = useState(0);

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

  // Handle image/video file selection
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setMediaDataUrl("");
      setMediaKind(null);
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Please select an image or video file.");
      setMediaDataUrl("");
      setMediaKind(null);
      return;
    }

    const maxBytes = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxBytes) {
      setError("File is too large (max 20 MB). Please choose a smaller file.");
      setMediaDataUrl("");
      setMediaKind(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setMediaDataUrl(reader.result);
        setMediaKind(isImage ? "image" : "video");
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setMediaDataUrl("");
      setMediaKind(null);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedId(null);

    if (authorId && !isHex24(authorId)) {
      setError("author_id must be a 24-hex MongoDB ObjectId string.");
      return;
    }

    if (!mediaDataUrl || !mediaKind) {
      setError("Please select an image or video to upload.");
      return;
    }

    if (!body.trim()) {
      setError("Post text is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        author_id: authorId || undefined,
        author_name: user && !anonymous ? postingName : undefined,
        anonymous: user ? anonymous : true,
        body: body.trim(),
      };

      if (mediaKind === "image") {
        payload.image_url = mediaDataUrl;
      } else if (mediaKind === "video") {
        payload.video_url = mediaDataUrl;
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Request failed (${res.status})`);
      }

      const json = await res.json(); // { id, status, message }
      const id = json?.insertedId || json?.id || null;

      setCreatedId(id);
      setBody("");
      setMediaDataUrl("");
      setMediaKind(null);
      setAnonymous(false);
      setFileKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.message || "Failed to create post.");
    } finally {
      setSubmitting(false);
    }
  }

  function onClear() {
    setBody("");
    setMediaDataUrl("");
    setMediaKind(null);
    setAnonymous(false);
    setError(null);
    setCreatedId(null);
    setFileKey((k) => k + 1);
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

          {/* Media file upload (required) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Image or video <span className="text-red-500">*</span>
            </label>
            <input
              key={fileKey}
              type="file"
              accept="image/*,video/*"
              onChange={onFileChange}
              className="block w-full text-sm text-neutral-700"
            />
            {mediaDataUrl && mediaKind === "image" && (
              <div className="mt-3">
                <img
                  src={mediaDataUrl}
                  className="max-h-64 rounded-lg border border-neutral-200 object-cover"
                  alt="preview"
                />
              </div>
            )}
            {mediaDataUrl && mediaKind === "video" && (
              <div className="mt-3">
                <video
                  src={mediaDataUrl}
                  controls
                  className="max-h-64 rounded-lg border border-neutral-200 object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Post text
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Describe the issue or your contribution…"
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
              Post created! ID: <code>{createdId}</code>. It will appear on
              Home after a moderator approves it.
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
              onClick={onClear}
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
