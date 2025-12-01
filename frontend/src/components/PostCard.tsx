import { useState } from "react";
import CommentsPanel from "./CommentsPanel";

/** Post as it comes from your API/Mongo */
export type ApiPost = {
  _id: string;
  author_name?: string | null;
  anonymous?: boolean;
  author_id?: string;
  body: string;
  image_url?: string | null;   // may hold image OR video data URL
  video_url?: string | null;   // older / future usage
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt?: string | Date;
};

export default function PostCard({ post }: { post: ApiPost }) {
  const [open, setOpen] = useState(false);
  const [commentCount, setCommentCount] = useState<number>(
    post.comments ?? 0
  );

  const likeCount = post.likes ?? 0;
  const shareCount = post.shares ?? 0;

  const baseAuthorLabel = post.anonymous
    ? "Anonymous"
    : post.author_name ??
      (post.author_id ? `User ${post.author_id.slice(-4)}` : "Unnamed User");

  const authorInitial = baseAuthorLabel[0]?.toUpperCase() ?? "U";

  const created =
    post.createdAt ? new Date(post.createdAt).toLocaleString() : "";

  // --- MEDIA DECISION LOGIC ---
  // Backend always stores media in image_url, but we also
  // respect video_url if it ever shows up.
  const mediaUrl: string | null =
    (post.image_url as string | null | undefined) ??
    (post.video_url as string | null | undefined) ??
    null;

  let mediaType: "image" | "video" | null = null;
  if (typeof mediaUrl === "string" && mediaUrl.length > 0) {
    if (mediaUrl.startsWith("data:video/") || mediaUrl.endsWith(".webm")) {
      mediaType = "video";
    } else {
      mediaType = "image";
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Media (image or video) */}
      <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        {mediaType === "image" && mediaUrl ? (
          <img
            src={mediaUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : mediaType === "video" && mediaUrl ? (
          <video
            src={mediaUrl}
            controls
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-400">
            No media
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

        {/* Comments panel */}
        {open && (
          <div className="mt-4">
            <CommentsPanel
              postId={post._id}
              onCountChange={setCommentCount}
            />
          </div>
        )}
      </div>
    </article>
  );
}
