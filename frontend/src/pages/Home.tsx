import PostCard from "../components/PostCard";
import type { Post } from "../components/PostCard";
import { useEffect, useState } from "react";  // added this

// API post coming from  backend
type ApiPost = {
  _id: string;
  author_id: string;
  body: string;
  image_url?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt?: string;
};

function shortAuthorName(author_id: string) {
  // just a readable placeholder until you join with users
  return `User ${author_id.slice(-4)}`;
}

function initialFrom(author_id: string) {
  return shortAuthorName(author_id).charAt(0).toUpperCase();
}

// Map ApiPost -> PostCard's Post type
function toCardPost(p: ApiPost, idx: number): Post {
  // You defined Post.id as a number; use index for now
  const created = p.createdAt ? new Date(p.createdAt) : new Date();
  return {
    id: idx + 1,
    author: { name: shortAuthorName(p.author_id), initial: initialFrom(p.author_id) },
    time: created.toLocaleString(), // you can make this "2 hours ago" later
    title: p.body.length > 50 ? p.body.slice(0, 50) + "…" : p.body || "Post",
    excerpt: p.body,
    likes: p.likes ?? 0,
    comments: p.comments ?? 0,
    shares: p.shares ?? 0,
    image:
      p.image_url ||
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
  };
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // NOTE: your backend route is /api/posts/ (trailing slash matters)
        const res = await fetch("/api/posts/", { credentials: "include" });
        if (!res.ok) throw new Error(`GET /api/posts failed: ${res.status}`);
        const data: ApiPost[] = await res.json();
        setPosts(data.map(toCardPost));
      } catch (e: any) {
        setErr(e.message ?? "Failed to load posts");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="px-4 pb-12 pt-6 md:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Eco-Leveling</h1>
        <p className="mt-2 text-neutral-600">
          Discover amazing nature photography from our community
        </p>
      </header>

      {loading && <div>Loading posts…</div>}
      {err && <div className="text-red-600">Error: {err}</div>}

      {!loading && !err && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {posts.length === 0 ? (
            <div>No posts yet.</div>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </section>
      )}
    </div>
  );
}
/*
const mockPosts: Post[] = [
  {
    id: 1,
    author: { name: "Emma Wilson", initial: "E" },
    time: "2 hours ago",
    title: "Serene Mountain Landscape",
    excerpt:
      "Captured this breathtaking view during my morning hike. The mist made everything feel magical.",
    likes: 127,
    comments: 23,
    shares: 12,
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    author: { name: "Alex Chen", initial: "A" },
    time: "4 hours ago",
    title: "Ancient Forest Path",
    excerpt: "Walking through this old-growth forest felt like stepping into another world.",
    likes: 203,
    comments: 41,
    shares: 18,
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    author: { name: "Maya Patel", initial: "M" },
    time: "6 hours ago",
    title: "Golden Hour Summit",
    excerpt: "After a tough 6-hour hike, this sunset felt like a reward.",
    likes: 89,
    comments: 15,
    shares: 9,
    image:
      "https://images.unsplash.com/photo-1473172707857-f9e276582ab6?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function Home() {
  return (
    <div className="px-4 pb-12 pt-6 md:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Eco-Leveling</h1>
        <p className="mt-2 text-neutral-600">
          Discover amazing nature photography from our community
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {mockPosts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </section>
    </div>
  );
}
*/