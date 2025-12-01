import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CommentsPanel from "./CommentsPanel";
import { useAuth } from "../Context/AuthContext";

/** Post as it comes from your API/Mongo */
export type ApiPost = {
  _id: string;
  author_name?: string | null;
  author_profile_pic_url?: string | null;
  anonymous?: boolean;
  author_id?: string;
  body: string;
  image_url?: string | null; // may hold image OR video data URL
  video_url?: string | null; // older / future usage
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt?: string | Date;
  liked?: boolean; // did the *current* user like this post?
};

export default function PostCard({
  post,
  onDeleted,
}: {
  post: ApiPost;
  onDeleted?: (postId: string) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth() as any;

  const [open, setOpen] = useState(false);
  const [commentCount, setCommentCount] = useState<number>(
    post.comments ?? 0
  );

  const [likeCount, setLikeCount] = useState<number>(post.likes ?? 0);
  const [isLiked, setIsLiked] = useState<boolean>(!!post.liked);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  const [isDeleting, setIsDeleting] = useState(false);

  // --------------- Author display ---------------
  const baseAuthorLabel = post.anonymous
    ? "Anonymous"
    : post.author_name ??
      (post.author_id ? `User ${post.author_id.slice(-4)}` : "Unnamed User");

  const authorInitial = baseAuthorLabel[0]?.toUpperCase() ?? "U";

  const created =
    post.createdAt ? new Date(post.createdAt).toLocaleString() : "";

  // --------------- Media decision ---------------
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

  // --------------- Permissions (delete) ---------------
  // Some places use isModerator, some use is_moderator – normalize here.
  const isModerator: boolean =
    !!(user?.isModerator ?? user?.is_moderator ?? false);

  const isAuthor: boolean =
    !!user?.id && !!post.author_id && user.id === post.author_id;

  // ✅ Authors can delete their own posts
  // ✅ Moderators can delete *any* post (even if author_id is missing)
  const canDelete: boolean = !!user && (isAuthor || isModerator);

  // --------------- Like handler ---------------
  async function handleToggleLike() {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to toggle like", res.status);
        return;
      }

      const data = await res.json(); // { liked, likes }
      setIsLiked(!!data.liked);

      if (typeof data.likes === "number") {
        setLikeCount(data.likes);
      }
    } catch (err) {
      console.error("Error toggling like", err);
    } finally {
      setIsLiking(false);
    }
  }

  // --------------- Delete handler ---------------
  async function handleDeletePost() {
    if (isDeleting) return;
    if (!window.confirm("Delete this post? This cannot be undone.")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error("Failed to delete post", res.status, msg);
        alert("Could not delete post (maybe you are not allowed).");
        return;
      }

      onDeleted?.(post._id);
    } catch (err) {
      console.error("Error deleting post", err);
      alert("Error deleting post.");
    } finally {
      setIsDeleting(false);
    }
  }

  const hasProfilePic =
    !post.anonymous &&
    post.author_profile_pic_url &&
    post.author_profile_pic_url.length > 0;

  // --------------- Public profile click ---------------
  function handleGoToProfile() {
    if (!post.author_id || post.anonymous) return;
    navigate(`/profile/${post.author_id}`);
  }

  const authorSectionProps =
    !post.anonymous && post.author_id
      ? {
          role: "button" as const,
          onClick: handleGoToProfile,
          className:
            "mb-4 flex items-center gap-3 text-sm text-neutral-600 cursor-pointer hover:bg-neutral-100/60 rounded-lg px-1 py-1",
        }
      : {
          className: "mb-4 flex items-center gap-3 text-sm text-neutral-600",
        };

  // --------------- Render ---------------
  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Media (image or video) */}
      <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        {mediaType === "image" && mediaUrl ? (
          <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
        ) : mediaType === "video" && mediaUrl ? (
          <video src={mediaUrl} controls className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-400">
            No media
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Author Info */}
        <div {...authorSectionProps}>
          {hasProfilePic ? (
            <img
              src={post.author_profile_pic_url as string}
              alt={baseAuthorLabel}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
              <span className="text-xs font-medium">{authorInitial}</span>
            </div>
          )}

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
            {/* Like button */}
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={isLiking}
              className="flex items-center gap-1 hover:underline disabled:opacity-60"
            >
              <span
                className={
                  "text-lg " +
                  (isLiked ? "text-red-500" : "text-neutral-400")
                }
              >
                ❤️
              </span>
              <span>{likeCount}</span>
            </button>

            {/* Comments */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="hover:underline"
              aria-expanded={open}
            >
              💬 {commentCount}
            </button>
          </div>

          {/* Delete button (owner / moderator only) */}
          {canDelete && (
            <button
              type="button"
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          )}

          {!canDelete && <div className="w-4" />}
        </div>

        {/* Comments panel */}
        {open && (
          <div className="mt-4">
            <CommentsPanel postId={post._id} onCountChange={setCommentCount} />
          </div>
        )}
      </div>
    </article>
  );
}
