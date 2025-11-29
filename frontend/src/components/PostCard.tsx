import React from "react";

export type ApiPost = {
  _id: string;
  author_name?: string | null;
  anonymous?: boolean;
  body: string;
  image_url?: string | null;
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt?: string | Date;
};

export default function PostCard({ post }: { post: ApiPost }) {
  const likeCount = post.likes ?? 0;
  const commentCount = post.comments ?? 0;
  const shareCount = post.shares ?? 0;

  const authorLabel = post.anonymous
    ? "Anonymous"
    : post.author_name ?? "Unnamed User";

  const authorInitial = authorLabel[0]?.toUpperCase() ?? "U";

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
            <div className="text-neutral-900">{authorLabel}</div>
            {created && <div className="text-xs">{created}</div>}
          </div>
        </div>

        {/* Body */}
        <p className="mb-4 text-sm text-neutral-700">{post.body}</p>

        {/* Actions */}
        <div className="mt-2 flex items-center justify-between text-neutral-700">
          <div className="flex items-center gap-5 text-sm">
            <span>❤️ {likeCount}</span>
            <span>💬 {commentCount}</span>
            <span>🔗 {shareCount}</span>
          </div>

          <button
            className="rounded-lg p-2 hover:bg-neutral-100"
            aria-label="Save"
          >
            📌
          </button>
        </div>
      </div>
    </article>
  );
}
