import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock3,
} from "lucide-react";
import { useAuth } from "../Context/AuthContext";

type PendingPost = {
  _id: string;
  author_name?: string | null;
  anonymous?: boolean;
  body: string;
  image_url?: string | null;
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt?: string | Date;
  status?: "pending" | "approved" | "declined" | string;
};

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-50">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {label}
        </span>
        <span className="text-xl font-semibold text-neutral-900">{value}</span>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return "";
  const now = new Date().getTime();
  const t = date.getTime();
  const diffMs = now - t;

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function Moderator() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  // NEW: local counters for this session
  const [approvedToday, setApprovedToday] = useState(0);
  const [declinedToday, setDeclinedToday] = useState(0);

  // 🚫 Protect route: only moderators allowed
  useEffect(() => {
    if (!loading && (!user || !user.isModerator)) {
      navigate("/"); // or /login
    }
  }, [user, loading, navigate]);

  // Fetch pending posts from backend
  useEffect(() => {
    async function fetchPending() {
      try {
        setIsLoadingPosts(true);
        const res = await fetch("/api/posts/moderation", {
          credentials: "include",
        });

        if (!res.ok) {
          // if forbidden, just bounce out
          if (res.status === 403) {
            navigate("/");
            return;
          }
          console.error("Failed to fetch pending posts", res.status);
          return;
        }

        const data = (await res.json()) as PendingPost[];
        setPendingPosts(data);
      } catch (err) {
        console.error("Error fetching pending posts", err);
      } finally {
        setIsLoadingPosts(false);
      }
    }

    if (user && user.isModerator) {
      fetchPending();
    }
  }, [user, navigate]);

  async function handleModerate(
    id: string,
    decision: "approve" | "decline"
  ) {
    try {
      setModeratingId(id);
      const res = await fetch(`/api/posts/${id}/moderate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision }),
      });

      if (!res.ok) {
        console.error("Failed to moderate post", res.status);
        return;
      }

      // Remove from list on success
      setPendingPosts((prev) => prev.filter((p) => p._id !== id));

      // 🔢 bump local stats
      if (decision === "approve") {
        setApprovedToday((n) => n + 1);
      } else {
        setDeclinedToday((n) => n + 1);
      }
    } catch (err) {
      console.error("Error moderating post", err);
    } finally {
      setModeratingId(null);
    }
  }

  if (!user || !user.isModerator) {
    // while redirecting or if not allowed, don't flash content
    return null;
  }

  const pendingCount = pendingPosts.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <ShieldCheck className="h-4 w-4" />
          <span>Moderator Dashboard</span>
        </div>
        <p className="max-w-xl text-sm text-neutral-500">
          Review and moderate posts pending approval.
        </p>
      </header>

      {/* Stats row */}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          label="Pending Review"
          value={pendingCount}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          label="Approved Today"
          value={approvedToday}
        />
        <StatCard
          icon={<XCircle className="h-4 w-4 text-rose-500" />}
          label="Declined Today"
          value={declinedToday}
        />
      </section>

      {/* Pending posts */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Clock3 className="h-4 w-4" />
          <span className="font-medium text-neutral-900">Pending Posts</span>
          <span className="rounded-full bg-neutral-100 px-2 text-xs font-medium text-neutral-600">
            {pendingCount}
          </span>
        </div>

        {isLoadingPosts ? (
          <div className="text-sm text-neutral-500">Loading pending posts…</div>
        ) : pendingCount === 0 ? (
          <div className="text-sm text-neutral-500">
            No posts are waiting for review right now 🎉
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pendingPosts.map((post) => {
              const authorLabel = post.anonymous
                ? "Anonymous"
                : post.author_name || "Unnamed User";
              const authorInitial =
                authorLabel[0]?.toUpperCase() ?? "U";
              const createdDate = post.createdAt
                ? new Date(post.createdAt)
                : null;

              const submittedAgo = createdDate
                ? formatRelativeTime(createdDate)
                : "";

              return (
                <article
                  key={post._id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.body.slice(0, 40)}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                        No media
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-4 p-4">
                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
                        <span className="text-sm font-medium text-neutral-700">
                          {authorInitial}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-900">
                          {authorLabel}
                        </span>
                        {submittedAgo && (
                          <span className="text-xs text-neutral-500">
                            Submitted {submittedAgo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-700">
                        {post.body}
                      </p>
                    </div>

                    {/* Meta (placeholder university, since backend doesn't have it) */}
                    <div className="space-y-1 text-xs text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        <span>EcoLeveling campus</span>
                      </div>
                      {createdDate && (
                        <div className="flex items-center gap-1.5">
                          <Clock3 className="h-3 w-3" />
                          <span>{createdDate.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex gap-3 pt-1">
                      <button
                        className="flex-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-60"
                        onClick={() =>
                          handleModerate(post._id, "decline")
                        }
                        disabled={moderatingId === post._id}
                      >
                        {moderatingId === post._id &&
                        user.isModerator
                          ? "Declining..."
                          : "Decline"}
                      </button>
                      <button
                        className="flex-1 rounded-full border border-emerald-500 bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
                        onClick={() =>
                          handleModerate(post._id, "approve")
                        }
                        disabled={moderatingId === post._id}
                      >
                        {moderatingId === post._id &&
                        user.isModerator
                          ? "Approving..."
                          : "Approve"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
