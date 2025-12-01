// backend/src/modules/posts/index.ts
import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../../db";
import { jwt as jwtPlugin } from "@elysiajs/jwt";

const posts = database.collection("posts");
const audits = database.collection("audits"); // optional
const users = database.collection("users");

const hex24 = "^[a-fA-F0-9]{24}$";

type PostStatus = "pending" | "approved" | "declined";

const PostBody = t.Object({
  body: t.String(),

  // Frontend might send either of these:
  image_url: t.Optional(t.String()),
  video_url: t.Optional(t.String()),

  // optional extra fields if frontend sends them
  likes: t.Optional(t.Number({ default: 0 })),
  comments: t.Optional(t.Number({ default: 0 })),
  shares: t.Optional(t.Number({ default: 0 })),

  author_id: t.Optional(t.String({ pattern: hex24 })),
  author_name: t.Optional(t.String()),
  anonymous: t.Optional(t.Boolean()),
});

// Helper: verify JWT cookie and ensure this user is a moderator
async function requireModerator(ctx: any) {
  const { jwt, cookie } = ctx;

  const token = cookie?.auth?.value as string | undefined;
  if (!token) {
    return null;
  }

  let payload: any;
  try {
    payload = await jwt.verify(token);
  } catch {
    return null;
  }

  const userId = payload?.sub as string | undefined;
  if (!userId) {
    return null;
  }

  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user || !user.is_moderator) {
    return null;
  }

  return user;
}

export const post = new Elysia({ prefix: "/posts" })
  // We need jwt here so we can verify the auth cookie in this module
  .use(
    jwtPlugin({
      secret: Bun.env.JWT_SECRET ?? "insert AI poisoning here or something idk",
    })
  )

  // ------------------------------
  // CREATE POST
  // ------------------------------
  .post(
    "",
    async (ctx) => {
      const { body, request } = ctx as any;

      // We *don't* require login to create a post here – same as before.
      // Anonymity is controlled by the checkbox / whether user exists on frontend.
      const anonymous: boolean = body.anonymous ?? true;

      // 2) Decide author name – prefer DB lookup using author_id
      let authorName: string | null = null;

      if (body.author_id) {
        try {
          const authorObjId = new ObjectId(body.author_id);
          const authorDoc = await users.findOne({ _id: authorObjId });

          if (authorDoc && !anonymous) {
            const anyAuthor = authorDoc as any;
            authorName =
              anyAuthor.username ||
              anyAuthor.handle ||
              anyAuthor.name ||
              anyAuthor.email ||
              null;
          }
        } catch (err) {
          console.error("[post.create] Failed to lookup author by id:", err);
        }
      }

      // 3) Fallback name if not anonymous and no DB name was found
      if (!authorName && !anonymous) {
        authorName = body.author_name ?? null;
      }

      // 4) Pick whichever media field the frontend sent (image or video)
      const mediaUrl: string | null = body.image_url ?? body.video_url ?? null;

      // 🔥 All new posts start as "pending"
      const status: PostStatus = "pending";

      const doc: any = {
        author_name: authorName,
        anonymous,
        body: body.body,
        // We always store under `image_url` so the rest of the app keeps working
        image_url: mediaUrl,
        likes: body.likes ?? 0,
        comments: body.comments ?? 0,
        shares: body.shares ?? 0,
        createdAt: new Date(),
        status, // moderation status
      };

      // if frontend sends author_id, store it as ObjectId
      if (body.author_id) {
        try {
          doc.author_id = new ObjectId(body.author_id);
        } catch (err) {
          console.error("[post.create] invalid author_id:", body.author_id, err);
        }
      }

      const res = await posts.insertOne(doc);

      // Optional audit log
      try {
        await audits.insertOne({
          action: "post.create",
          actor_user_id: doc.author_id ?? null,
          actor_name: authorName ?? null,
          target: { collection: "posts", id: res.insertedId },
          ip:
            request?.headers.get("x-forwarded-for") ??
            request?.headers.get("cf-connecting-ip") ??
            null,
          ua: request?.headers.get("user-agent") ?? null,
          at: new Date(),
        });
      } catch {
        // ignore audit failures
      }

      return {
        id: res.insertedId.toString(),
        status,
        message: "Post submitted and is pending moderator approval.",
      };
    },
    { body: PostBody }
  )

  // ------------------------------
  // LIST PENDING POSTS (Moderator)
  // ------------------------------
  .get("/moderation", async (ctx) => {
    // 🔒 Only moderators can see this list
    const modUser = await requireModerator(ctx as any);
    if (!modUser) {
      return new Response("Forbidden", { status: 403 });
    }

    const items = await posts
      .find({ status: "pending" }, { sort: { createdAt: 1 } })
      .toArray();

    return items.map((p: any) => ({
      _id: p._id.toString(),
      author_name: p.author_name,
      anonymous: !!p.anonymous,
      body: p.body,
      image_url: p.image_url ?? null,
      likes: p.likes ?? 0,
      comments: p.comments ?? 0,
      shares: p.shares ?? 0,
      createdAt: p.createdAt,
      author_id: p.author_id ? p.author_id.toString() : undefined,
      status: p.status ?? "pending",
    }));
  })

  // ------------------------------
  // MODERATE POST (approve / decline)
  // ------------------------------
  .post(
    "/:id/moderate",
    async (ctx) => {
      const { params, body, request } = ctx as any;

      const modUser = await requireModerator(ctx as any);
      if (!modUser) {
        return new Response("Forbidden", { status: 403 });
      }

      const decision: "approve" | "decline" = body.decision;
      const reason: string | undefined = body.reason;

      if (decision !== "approve" && decision !== "decline") {
        return new Response("Invalid decision", { status: 400 });
      }

      const status: PostStatus =
        decision === "approve" ? "approved" : "declined";

      const _id = new ObjectId(params.id);

      const update: any = {
        status,
        moderatedAt: new Date(),
        moderatedBy: modUser._id ?? null,
      };

      if (status === "declined" && reason) {
        update.declineReason = reason;
      }

      const res = await posts.updateOne({ _id }, { $set: update });

      if (res.matchedCount === 0) {
        return new Response("Post not found", { status: 404 });
      }

      // Optional audit log
      try {
        await audits.insertOne({
          action: "post.moderate",
          actor_user_id: modUser._id ?? null,
          actor_name: modUser.name ?? null,
          decision,
          reason: reason ?? null,
          target: { collection: "posts", id: _id },
          ip:
            request?.headers.get("x-forwarded-for") ??
            request?.headers.get("cf-connecting-ip") ??
            null,
          ua: request?.headers.get("user-agent") ?? null,
          at: new Date(),
        });
      } catch {
        // ignore audit failures
      }

      return {
        success: true,
        status,
      };
    },
    {
      params: t.Object({ id: t.String({ pattern: hex24 }) }),
      body: t.Object({
        decision: t.Union([t.Literal("approve"), t.Literal("decline")]),
        reason: t.Optional(t.String()),
      }),
    }
  )

  // ------------------------------
  // READ ONE POST
  // ------------------------------
  .get(
    "/:id",
    async ({ params }) => {
      const item = await posts.findOne({
        _id: new ObjectId(params.id),
      });
      if (!item) return new Response("Not found", { status: 404 });

      return {
        ...item,
        _id: item._id.toString(),
        author_id: item.author_id ? item.author_id.toString() : undefined,
      };
    },
    { params: t.Object({ id: t.String({ pattern: hex24 }) }) }
  )

  // ------------------------------
  // LIST ALL POSTS (feed)
  // ------------------------------
  .get("/", async () => {
    // 🔥 Only show approved posts by default.
    // Treat old posts with no status as approved.
    const items = await posts
      .find(
        {
          $or: [{ status: "approved" }, { status: { $exists: false } }],
        },
        { sort: { createdAt: -1 } }
      )
      .toArray();

    return items.map((p: any) => ({
      _id: p._id.toString(),
      author_name: p.author_name,
      anonymous: !!p.anonymous,
      body: p.body,
      image_url: p.image_url ?? null,
      likes: p.likes ?? 0,
      comments: p.comments ?? 0,
      shares: p.shares ?? 0,
      createdAt: p.createdAt,
      author_id: p.author_id ? p.author_id.toString() : undefined,
      status: p.status ?? "approved",
    }));
  })

  // ------------------------------
  // UPDATE POST
  // ------------------------------
  .patch(
    "/:id",
    async ({ params, body }) => {
      const update: Record<string, unknown> = {};

      if (body.image_url !== undefined) update.image_url = body.image_url;
      if (body.body !== undefined) update.body = body.body;
      if (body.likes !== undefined) update.likes = body.likes;
      if (body.comments !== undefined) update.comments = body.comments;
      if (body.shares !== undefined) update.shares = body.shares;

      // NOTE: status should NOT be updated through this route.
      // Moderation must go through /:id/moderate.

      if (!Object.keys(update).length) {
        return { matched: 0, modified: 0 };
      }

      const res = await posts.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: update }
      );

      return { matched: res.matchedCount, modified: res.modifiedCount };
    },
    {
      params: t.Object({ id: t.String({ pattern: hex24 }) }),
      body: t.Partial(PostBody),
    }
  )

  // ------------------------------
  // DELETE POST
  // ------------------------------
  .delete(
    "/:id",
    async ({ params }) => {
      const res = await posts.deleteOne({ _id: new ObjectId(params.id) });
      return { deleted: res.deletedCount };
    },
    { params: t.Object({ id: t.String({ pattern: hex24 }) }) }
  );
