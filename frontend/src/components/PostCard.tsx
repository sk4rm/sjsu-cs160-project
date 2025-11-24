import { useState } from "react";
import CommentsPanel from "./CommentsPanel";

/** Post as it comes from your API/Mongo */
export type ApiPost = {
  _id: string;
  author_name: string | null;
  anonymous: boolean;
  body: string;
  image_url?: string | null;
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt?: string;
};

export default function PostCard({ post }: { post: ApiPost }) {
  const [open, setOpen] = useState(false);
  const [commentCount, setCommentCount] = useState<number>(
    post.comments ?? 0
  );

  const likeCount = post.likes ?? 0;
  const shareCount = post.shares ?? 0;

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
        {/* Author + time */}
        <div className="mb-3 text-sm text-neutral-600">
          <div className="font-medium text-neutral-900">
            {post.author_name ?? "Anonymous"}
          </div>
          {post.createdAt && (
            <div className="text-xs">
              {new Date(post.createdAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Body */}
        <p className="mb-4 text-neutral-800">{post.body}</p>

        {/* Actions */}
        <div className="mt-2 flex items-center justify-between text-neutral-700">
          <div className="flex items-center gap-5 text-sm">
            <span>❤️ {likeCount}</span>

            {/* open comments */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="hover:underline"
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

        {/* Comments panel */}
        {open && (
          <div className="mt-4">
            <CommentsPanel
              postId={post._id}
              onCountChange={(n) => setCommentCount(n)}
            />
          </div>
        )}
      </div>
    </article>
  );
}
