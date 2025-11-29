import React, { useEffect, useState } from "react";

type ApiComment = {
  _id: string;
  post_id: string;
  author_name?: string | null;
  anonymous?: boolean;
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
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadComments() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/comments/by-post/${postId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to load comments (${res.status})`);
      const data: ApiComment[] = await res.json();
      setComments(data);
      onCountChange?.(data.length);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          post_id: postId,
          body: text.trim(),
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Failed to post comment (${res.status})`);
      }

      setText("");
      await loadComments(); // refresh list + count
    } catch (e: any) {
      setErr(e.message ?? "Failed to post comment");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-neutral-800">Comments</h4>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : err ? (
        <p className="text-sm text-red-600">{err}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-neutral-500">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c._id} className="rounded-lg bg-white p-3 shadow-sm">
              <div className="text-xs text-neutral-500">
                {c.anonymous || !c.author_name ? "Anonymous" : c.author_name}
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

      <form onSubmit={sendComment} className="mt-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {sending ? "Posting…" : "Post"}
        </button>
      </form>
    </div>
  );
}
