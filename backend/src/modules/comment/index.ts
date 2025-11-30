import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../../db";

const comments = database.collection("comments");
const posts = database.collection("posts");
const audits = database.collection("audits");
const users = database.collection("users");

export const commentsModule = new Elysia({ prefix: "/comments" })

  // -----------------------------
  // List comments for a post
  // -----------------------------
  .get(
    "/by-post/:postId",
    async ({ params }) => {
      const list = await comments
        .find({ post_id: new ObjectId(params.postId) })
        .sort({ createdAt: 1 })
        .toArray();

      return list.map((c: any) => ({
        ...c,
        _id: c._id.toString(),
        post_id: c.post_id.toString(),
        author_id: c.author_id ? c.author_id.toString() : undefined,
      }));
    },
    {
      params: t.Object({
        postId: t.String({ pattern: "^[a-fA-F0-9]{24}$" }),
      }),
    }
  )

  // -----------------------------
  // Create a comment
  // -----------------------------
  .post(
    "",
    async (ctx) => {
      const { body, user, request } = ctx as any;

      const postObjectId = new ObjectId(body.post_id);

      // Figure out the author ObjectId
      let authorObjectId: ObjectId | null = null;

      if (body.author_id && ObjectId.isValid(body.author_id)) {
        authorObjectId = new ObjectId(body.author_id);
      } else if (user?._id) {
        // ctx.user._id might already be an ObjectId; wrapping again is safe
        authorObjectId = new ObjectId(user._id);
      }

      // Always look up the *current* name from the users collection.
      // Do NOT trust body.author_name or user.name (cookie may be stale).
      let authorName: string | null = null;
      if (authorObjectId) {
        try {
          const authorDoc = await users.findOne({ _id: authorObjectId });
          authorName = (authorDoc as any)?.name ?? null;
        } catch (err) {
          console.error("[comment.create] Failed to load author from users:", err);
        }
      }

      // Anonymous flag – if not logged in or no author id, force anonymous.
      let anonymous: boolean =
        body.anonymous ?? !authorObjectId;

      const doc: any = {
        post_id: postObjectId,
        author_name: authorName,
        anonymous,
        body: body.body,
        likes: 0,
        createdAt: new Date(),
      };

      if (authorObjectId) {
        doc.author_id = authorObjectId;
      }

      const res = await comments.insertOne(doc);

      // increment comment count on the post
      await posts.updateOne(
        { _id: postObjectId },
        { $inc: { comments: 1 } }
      );

      try {
        await audits.insertOne({
          action: "comment.create",
          actor_user_id: user?._id ?? authorObjectId ?? null,
          actor_name: authorName ?? user?.name ?? null,
          post_target: body.post_id,
          target: { collection: "comments", id: res.insertedId },
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

      return { id: res.insertedId.toString() };
    },
    {
      body: t.Object({
        post_id: t.String({ pattern: "^[a-fA-F0-9]{24}$" }),
        body: t.String(),
        author_id: t.Optional(t.String({ pattern: "^[a-fA-F0-9]{24}$" })),
        // we still accept these fields for compatibility, but we ignore
        // author_name and recompute it from the users collection.
        author_name: t.Optional(t.String()),
        anonymous: t.Optional(t.Boolean()),
      }),
    }
  )

  // -----------------------------
  // Get a single comment
  // -----------------------------
  .get(
    "/:id",
    async ({ params }) => {
      const c: any = await comments.findOne({ _id: new ObjectId(params.id) });
      if (!c) return new Response("Not found", { status: 404 });

      return {
        ...c,
        _id: c._id.toString(),
        post_id: c.post_id.toString(),
        author_id: c.author_id ? c.author_id.toString() : undefined,
      };
    },
    {
      params: t.Object({
        id: t.String({ pattern: "^[a-fA-F0-9]{24}$" }),
      }),
    }
  )

  // -----------------------------
  // Update a comment
  // -----------------------------
  .patch(
    "/:id",
    async (ctx) => {
      const { params, body, user } = ctx as any;

      const _id = new ObjectId(params.id);
      const update: { $set: any } = { $set: {} };

      if (body.body !== undefined) update.$set.body = body.body;

      if (!Object.keys(update.$set).length) {
        return { matched: 0, modified: 0 };
      }

      const res = await comments.updateOne({ _id }, update);

      try {
        await audits.insertOne({
          action: "comment.update",
          actor_user_id: user?._id ?? null,
          actor_name: user?.name ?? null,
          target: { collection: "comments", id: _id },
          changed: Object.keys(update.$set),
          at: new Date(),
        });
      } catch {}

      return { matched: res.matchedCount, modified: res.modifiedCount };
    },
    {
      params: t.Object({
        id: t.String({ pattern: "^[a-fA-F0-9]{24}$" }),
      }),
      body: t.Object({
        body: t.Optional(t.String()),
      }),
    }
  )

  // -----------------------------
  // Delete a comment
  // -----------------------------
  .delete(
    "/:id",
    async (ctx) => {
      const { params, user } = ctx as any;

      const _id = new ObjectId(params.id);

      // find the comment first so we know which post to decrement
      const existing: any = await comments.findOne({ _id });
      if (!existing) {
        return { deleted: 0 };
      }

      const res = await comments.deleteOne({ _id });

      // decrement comment count on the post
      await posts.updateOne(
        { _id: existing.post_id },
        { $inc: { comments: -1 } }
      );

      try {
        await audits.insertOne({
          action: "comment.delete",
          actor_user_id: user?._id ?? null,
          actor_name: user?.name ?? null,
          target: { collection: "comments", id: _id },
          at: new Date(),
        });
      } catch {}

      return { deleted: res.deletedCount };
    },
    {
      params: t.Object({
        id: t.String({ pattern: "^[a-fA-F0-9]{24}$" }),
      }),
    }
  );
