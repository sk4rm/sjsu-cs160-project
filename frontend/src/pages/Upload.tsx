import { useState } from "react";

export default function Upload() {
  const [imageUrl, setImageUrl] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedId(null);

    if (!body.trim()) {
      setError("Post text is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          image_url: imageUrl.trim() || undefined,
          body: body.trim(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setCreatedId(json?.id ?? null);
      setBody("");
      setImageUrl("");
    } catch (e: any) {
      setError(e?.message || "Failed to create post.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Upload</h1>

      <div className="mx-auto max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-5">

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Image URL (optional)
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Post text
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Say something…"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-500"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {createdId && (
            <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
              Posted! ID: <code>{createdId}</code>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create Post"}
            </button>
            <button
              type="button"
              onClick={() => {
                setBody("");
                setImageUrl("");
                setError(null);
                setCreatedId(null);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
