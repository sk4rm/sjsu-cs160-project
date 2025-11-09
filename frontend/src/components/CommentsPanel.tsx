import { useEffect, useState } from "react";

type Comment = {
  _id: string;
  post_id: string;
  author_id: string;
  body: string;
  likes?: number;
  createdAt?: string;
};

type Props = {
  postId: string;
  meId: string; // commenter id
  onCountChange?: (n: number) => void; // tell PostCard the current count
};

export default function CommentsPanel({ postId, meId, onCountChange }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // <-- use the route we added in backend
      const res = await fetch(`/api/comments/by-post/${postId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Comment[];
      const list = Array.isArray(data) ? data : [];
      setComments(list);
      onCountChange?.(list.length); // update 💬 badge on the card
    } catch (e: any) {
      setError(e?.message || "Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          post_id: postId,
          author_id: meId,     // now uses the prop from PostCard/auth
          body: text.trim(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setText("");

      // Option A: optimistic append (faster UI)...
      // const created = await res.json(); // if your API returns the inserted comment
      // setComments(prev => {
      //   const next = [...prev, created];
      //   onCountChange?.(next.length);
      //   return next;
      // });

      // Option B: simple reload (keeps code tiny)
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to post comment.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-neutral-200 p-3">
      <h4 className="mb-2 text-sm font-medium">Comments</h4>

      {loading ? <div className="text-sm text-neutral-500">Loading…</div> : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c._id} className="rounded-md bg-neutral-50 p-2 text-sm">
            <div className="mb-1 text-xs text-neutral-500">
              User {c.author_id.slice(-4)} •{" "}
              {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
            </div>
            <div>{c.body}</div>
          </div>
        ))}
        {comments.length === 0 && !loading ? (
          <div className="text-sm text-neutral-500">No comments yet.</div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <button
          disabled={posting || !text.trim()}
          className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </form>
    </div>
  );
}
