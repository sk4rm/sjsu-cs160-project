import React from "react";

export type Post = {
  id: number;
  author: { name: string; initial: string };
  time: string;
  title: string;
  excerpt: string;
  likes: number;
  comments: number;
  shares: number;
  image: string;
};

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Image */}
      <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        <img
          src={post.image}
          alt={post.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Author Info */}
        <div className="mb-4 flex items-center gap-3 text-sm text-neutral-600">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
            <span className="text-xs font-medium">
              {post.author.initial}
            </span>
          </div>
          <div className="leading-tight">
            <div className="text-neutral-900">{post.author.name}</div>
            <div className="text-xs">{post.time}</div>
          </div>
        </div>

        {/* Title + Excerpt */}
        <h3 className="mb-2 text-lg font-semibold tracking-tight text-neutral-900">
          {post.title}
        </h3>
        <p className="mb-4 text-sm text-neutral-600">{post.excerpt}</p>

        {/* Actions */}
        <div className="mt-2 flex items-center justify-between text-neutral-700">
          <div className="flex items-center gap-5 text-sm">
            <span>❤️ {post.likes}</span>
            <span>💬 {post.comments}</span>
            <span>🔗 {post.shares}</span>
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
import { NavLink } from "react-router-dom";

// …inside your nav list
<NavLink
  to="/upload"
  className={({ isActive }) =>
    `flex items-center gap-2 rounded px-3 py-2 ${
      isActive ? "bg-green-100 font-medium text-green-700" : "hover:bg-neutral-100"
    }`
  }
>
  {/* simple “plus” icon */}
  <span className="inline-block w-5 text-center">＋</span>
  <span>Upload</span>
</NavLink>
