import React, { useEffect, useState } from "react";

type ApiComment = {
  _id: string;
  post_id: string;
  author_name?: string | null;
  author_id?: string;        // merged
  anonymous?: boolean;
  body: string;
  likes?: number;
  createdAt?: string;
};

export default function CommentsPanel({
  postId,
  meId,
  onCountChange,
}: {
  postId: string;
  meId?: string;              // optional if user isn't logged in
  onCountChange?: (n: number) => void;
}) {
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/comments/by-post/${postId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());

      const data = (await res.json()) as ApiComment[];
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
          body: text.trim(),
          author_id: meId,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setText("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to post comment.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-neutral-800">Comments</h4>

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && comments.length === 0 && (
        <p className="text-sm text-neutral-500">No comments yet.</p>
      )}

      {!loading && !error && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c._id} className="rounded-lg bg-white p-3 shadow-sm">
              <div className="text-xs text-neutral-500">
                {c.anonymous || !c.author_name
                  ? "Anonymous"
                  : c.author_name}
              </div>

              <div className="mt-1 text-sm text-neutral-800">{c.body}</div>

              {c.createdAt && (
                <div className="mt-1 text-[11px] text-neutral-400">
                  {new Date(c.createdAt).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <button
          type="submit"
          disabled={posting}
          className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </form>
    </div>
  );
}
