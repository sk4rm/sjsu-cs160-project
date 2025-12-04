import { useEffect, useState } from "react";
import PostCard, { type ApiPost } from "../components/PostCard";
// (Optional) if you want an icon inside the input:
// import { Search } from "lucide-react";

export default function Home() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // NEW: school search query
  const [schoolQuery, setSchoolQuery] = useState("");

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

  // NEW: posts filtered by the search bar
  const visiblePosts = posts.filter((p) => {
    const query = schoolQuery.trim().toLowerCase();
    if (!query) return true; // no search → show all
    if (!p.school) return false;
    return p.school.toLowerCase().includes(query);
  });

  if (loading) return <div className="p-6">Loading posts…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="px-4 pb-12 pt-6 md:px-8">
      <header className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Eco-Leveling</h1>
        <p className="mt-2 text-neutral-600">
          Level Up Your Campus
        </p>
      </header>

      {/* 🔍 School search bar */}
      <div className="mb-6 max-w-md">
        <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">
          Search by school
        </label>
        <div className="relative">
          {/* Optional icon
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          */}
          <input
            type="text"
            value={schoolQuery}
            onChange={(e) => setSchoolQuery(e.target.value)}
            placeholder="e.g. San Jose State University…"
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-neutral-400"
            // if using icon, change px-3 → pl-9 pr-3
          />
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {visiblePosts.length === 0 ? (
          <div>No posts match that school.</div>
        ) : (
          visiblePosts.map((p) => (
            <PostCard key={p._id} post={p} onDeleted={handlePostDeleted} />
          ))
        )}
      </section>
    </div>
  );
}
