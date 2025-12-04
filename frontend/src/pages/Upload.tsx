// frontend/src/pages/Upload.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { ListChecks } from "lucide-react";

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

// ---- Quests types ----
type Quest = {
  id: string;
  title: string;
  description: string;
  points: number;
};

// Fallback quests if /api/quests/today isn't configured yet
const FALLBACK_QUESTS: Quest[] = [
  {
    id: "q1",
    title: "Pick up 5 pieces of litter",
    description:
      "Snap a photo of trash you removed from your campus or neighborhood.",
    points: 10,
  },
  {
    id: "q2",
    title: "Spot a green innovation",
    description:
      "Share a picture of an eco-friendly feature (solar panels, refill station, etc.).",
    points: 15,
  },
  {
    id: "q3",
    title: "Before / after improvement",
    description:
      "Show how you improved a space: recycling setup, plant care, cleanup, etc.",
    points: 20,
  },
];

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

  // NEW: quests + selected quest
  const [quests, setQuests] = useState<Quest[]>(FALLBACK_QUESTS);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

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

  // NEW: fetch today's quests from backend (if available)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/quests/today");
        if (!res.ok) return;

        const data = await res.json();
        const list = Array.isArray(data) ? data : data.quests;

        if (Array.isArray(list)) {
          setQuests(
            list.map((q: any, idx: number) => ({
              id: q.id ?? `q-${idx}`,
              title: q.title ?? `Quest ${idx + 1}`,
              description: q.description ?? "",
              points: typeof q.points === "number" ? q.points : 0, // default
            }))
          );
        }
      } catch {
        // ignore – fallback quests already set
      }
    })();
  }, []);

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

    // NEW: require quest selection
    if (!selectedQuestId) {
      setError("Please choose which quest this upload is for.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        author_id: authorId || undefined,
        author_name: user && !anonymous ? postingName : undefined,
        anonymous: user ? anonymous : true,
        body: body.trim(),
        quest_id: selectedQuestId, // 👈 used by moderator/backend for points
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
      setSelectedQuestId(null);
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
    setSelectedQuestId(null);
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Upload</h1>

      {/* Two-column layout: upload form + quests */}
      <div className="mx-auto flex max-w-5xl flex-col gap-6 lg:flex-row">
        {/* Left: upload form */}
        <div className="lg:flex-[2]">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
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

              {/* NEW: Which quest is this for? */}
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Which quest is this upload for? <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 text-sm">
                  {quests.map((quest, index) => (
                    <label
                      key={quest.id}
                      className="flex cursor-pointer items-start gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 hover:border-neutral-400"
                    >
                      <input
                        type="radio"
                        name="quest"
                        value={quest.id}
                        checked={selectedQuestId === quest.id}
                        onChange={() => setSelectedQuestId(quest.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">
                          Quest {index + 1}: {quest.title}
                        </p>
                        <p className="text-xs text-neutral-600">{quest.description}</p>
                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                          Reward: {quest.points} pts
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
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

        {/* Right: daily quests overview */}
        <div className="lg:flex-1">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white">
                <ListChecks className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  Today&apos;s Quests
                </p>
                <p className="text-xs text-neutral-500">
                  Choose a quest on the left when you upload.
                </p>
              </div>
            </div>

            <ul className="space-y-3 text-sm">
              {quests.map((quest, index) => (
                <li key={quest.id} className="rounded-lg bg-neutral-50 px-3 py-2">
                  <p className="font-medium">
                    Quest {index + 1}: {quest.title}
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">
                    {quest.description}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    Reward: {quest.points} pts
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs text-neutral-500">
              Quests refresh every day. Points are added after a moderator approves
              your post.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
