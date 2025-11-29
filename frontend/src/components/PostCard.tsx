import { useState } from "react";
import CommentsPanel from "./CommentsPanel";

/** Post as it comes from your API/Mongo */
export type ApiPost = {
  _id: string;
  author_name?: string | null;
  anonymous?: boolean;
  author_id?: string;
  body: string;
  image_url?: string | null;
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt?: string | Date;
};

export default function PostCard({
  post,
  meId,
}: {
  post: ApiPost;
  meId?: string; // optional; can be passed from auth/user context later
}) {
  const [open, setOpen] = useState(false);
  const [commentCount, setCommentCount] = useState<number>(
    post.comments ?? 0
  );

  const likeCount = post.likes ?? 0;
  const shareCount = post.shares ?? 0;

  // Prefer anonymous logic / author_name, but fall back to author_id or default label
  const baseAuthorLabel = post.anonymous
    ? "Anonymous"
    : post.author_name ??
      (post.author_id ? `User ${post.author_id.slice(-4)}` : "Unnamed User");

  const authorInitial = baseAuthorLabel[0]?.toUpperCase() ?? "U";

  const created =
    post.createdAt ? new Date(post.createdAt).toLocaleString() : "";

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Image */}
      <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-400">
            No image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Author Info */}
        <div className="mb-4 flex items-center gap-3 text-sm text-neutral-600">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
            <span className="text-xs font-medium">{authorInitial}</span>
          </div>

          <div className="leading-tight">
            <div className="text-neutral-900">{baseAuthorLabel}</div>
            {created && <div className="text-xs">{created}</div>}
          </div>
        </div>

        {/* Body */}
        <p className="mb-4 text-sm text-neutral-700">{post.body}</p>

        {/* Actions */}
        <div className="mt-2 flex items-center justify-between text-neutral-700">
          <div className="flex items-center gap-5 text-sm">
            <span>❤️ {likeCount}</span>

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="hover:underline"
              aria-expanded={open}
            >
              💬 {commentCount}
            </button>

            <span>🔗 {shareCount}</span>
          </div>

          <button
            className="rounded-lg p-2 hover:bg-neutral-100"
            aria-label="Save"
          >
            📌
          </button>
        </div>

        {/* Comments panel (all logic lives inside CommentsPanel) */}
        {open && (
          <div className="mt-4">
            <CommentsPanel
              postId={post._id}
              meId={meId}
              onCountChange={setCommentCount}
            />
          </div>
        )}
      </div>
    </article>
  );
}
