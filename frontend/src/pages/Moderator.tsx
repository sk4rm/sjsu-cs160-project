import { useEffect } from "react";
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
  id: string;
  imageUrl: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  title: string;
  caption: string;
  university: string;
  submittedAgo: string;
};

// TODO: replace with real data from your backend
const mockPendingPosts: PendingPost[] = [
  {
    id: "1",
    imageUrl:
      "https://images.unsplash.com/photo-1582401655777-990d6c0e732a?auto=format&fit=crop&w=1200&q=80",
    authorName: "David Lee",
    authorHandle: "@davidshoots",
    authorAvatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
    title: "Campus Garden Blooms",
    caption: "Beautiful flowers blooming in the university quad garden.",
    university: "Stanford University",
    submittedAgo: "10 minutes ago",
  },
  {
    id: "2",
    imageUrl:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80",
    authorName: "Rachel Park",
    authorHandle: "@rachel_captures",
    authorAvatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    title: "Autumn Campus Walk",
    caption:
      "The trees along the main pathway turning golden and orange.",
    university: "University of Michigan",
    submittedAgo: "25 minutes ago",
  },
  {
    id: "3",
    imageUrl:
      "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=80",
    authorName: "James Kim",
    authorHandle: "@kim_nature",
    authorAvatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    title: "Campus Wildlife",
    caption: "A robin perched on the fountain near the library.",
    university: "Yale University",
    submittedAgo: "1 hour ago",
  },
];

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

export default function Moderator() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // 🚫 Protect route: only moderators allowed
  useEffect(() => {
    if (!loading && (!user || !user.isModerator)) {
      navigate("/"); // or /login
    }
  }, [user, loading, navigate]);

  if (!user || !user.isModerator) {
    // while redirecting or if not allowed, don't flash content
    return null;
  }

  const pendingCount = mockPendingPosts.length;
  const approvedToday = 0; // TODO from backend
  const declinedToday = 0; // TODO from backend

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

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {mockPendingPosts.map((post) => (
            <article
              key={post.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
            >
              {/* Image */}
              <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-neutral-200">
                    {post.authorAvatar ? (
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-900">
                      {post.authorName}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {post.authorHandle}
                    </span>
                  </div>
                </div>

                {/* Title & caption */}
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {post.title}
                  </h3>
                  <p className="text-xs text-neutral-600">{post.caption}</p>
                </div>

                {/* Meta */}
                <div className="space-y-1 text-xs text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    <span>{post.university}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock3 className="h-3 w-3" />
                    <span>Submitted {post.submittedAgo}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto flex gap-3 pt-1">
                  <button
                    className="flex-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100"
                    onClick={() => {
                      // TODO: call backend to decline
                      console.log("Decline", post.id);
                    }}
                  >
                    Decline
                  </button>
                  <button
                    className="flex-1 rounded-full border border-emerald-500 bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                    onClick={() => {
                      // TODO: call backend to approve
                      console.log("Approve", post.id);
                    }}
                  >
                    Approve
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
