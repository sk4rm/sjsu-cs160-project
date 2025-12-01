import { useEffect, useState } from "react";
import PostCard, { type ApiPost } from "../components/PostCard";

export default function Home() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/posts/", {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`GET /api/posts failed: ${res.status}`);

        const data: ApiPost[] = await res.json();
        setPosts(data);
      } catch (e: any) {
        setErr(e.message ?? "Failed to load posts");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handlePostDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p._id !== id));
  }

  if (loading) return <div className="p-6">Loading posts…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="px-4 pb-12 pt-6 md:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Eco-Leveling</h1>
        <p className="mt-2 text-neutral-600">
          Discover amazing posts from our community
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {posts.length === 0 ? (
          <div>No posts yet.</div>
        ) : (
          posts.map((p) => (
            <PostCard key={p._id} post={p} onDeleted={handlePostDeleted} />
          ))
        )}
      </section>
    </div>
  );
}
