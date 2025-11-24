import { useEffect, useState } from "react";

type Comment = {
  _id: string;
  post_id: string;
  author_name: string | null; // null => Anonymous
  body: string;
  likes?: number;
  createdAt?: string;
};

export default function CommentsPanel({
  postId,
  onCountChange,
}: {
  postId: string;
  onCountChange?: (n: number) => void;
}) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Keep your existing endpoint unless you changed it
      const res = await fetch(`/api/comments/by-post/${postId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Comment[];
      const list = Array.isArray(data) ? data : [];
      setComments(list);
      onCountChange?.(list.length);
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
    const body = text.trim();
    if (!body) return;

    setPosting(true);
    setError(null);

    // Optimistic UI
    const optimistic: Comment = {
      _id: `tmp-${crypto.randomUUID()}`,
      post_id: postId,
      author_name: null, // will render as "Anonymous" until reload
      body,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => (prev ? [...prev, optimistic] : [optimistic]));
    onCountChange?.((comments?.length ?? 0) + 1);
    setText("");

    try {
      // No author_id sent; backend resolves from cookie or sets anonymous
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ post_id: postId, body }),
      });
      if (!res.ok) throw new Error(await res.text());

      // Refresh to replace optimistic item with real one
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to post comment.");
      // revert optimistic add
      setComments((prev) =>
        prev ? prev.filter((c) => c._id !== optimistic._id) : prev
      );
      onCountChange?.((comments?.length ?? 1) - 1);
      setText(body);
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
        {comments?.map((c) => (
          <div key={c._id} className="rounded-md bg-neutral-50 p-2 text-sm">
            <div className="mb-1 text-xs text-neutral-500">
              {c.author_name ?? "Anonymous"}
              {c.createdAt ? ` • ${new Date(c.createdAt).toLocaleString()}` : ""}
            </div>
            <div>{c.body}</div>
          </div>
        ))}
        {!loading && comments && comments.length === 0 && !error ? (
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
