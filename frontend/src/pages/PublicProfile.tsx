import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PostCard, { type ApiPost } from "../components/PostCard"; // 👈 note `type`

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/posts/by-author/${userId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`GET /posts/by-author failed: ${res.status}`);
        }
        const data: ApiPost[] = await res.json();
        setPosts(data);
      } catch (e: any) {
        setErr(e?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  function handlePostDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p._id !== id));
  }

  if (!userId) {
    return <div className="p-6">No user selected.</div>;
  }

  const first = posts[0];
  const displayName =
    first?.author_name || `User ${userId.slice(-4)}`;
  const avatarUrl = first?.author_profile_pic_url;

  return (
    <div className="px-4 pb-12 pt-6 md:px-8">
      <header className="mb-6 flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
            <span className="text-sm font-medium">
              {displayName[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {displayName}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Posts by this user
          </p>
        </div>
      </header>

      {loading && <div>Loading profile…</div>}
      {err && <div className="text-red-600">Error: {err}</div>}

      {!loading && !err && posts.length === 0 && (
        <div>This user has not posted anything yet.</div>
      )}

      {!loading && !err && posts.length > 0 && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard
              key={p._id}
              post={p}
              onDeleted={handlePostDeleted}
            />
          ))}
        </section>
      )}
    </div>
  );
}
