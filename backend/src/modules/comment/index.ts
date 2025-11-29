import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../../db";

const comments = database.collection("comments");
const posts = database.collection("posts");
const audits = database.collection("audits");

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

      return list.map((c) => ({
        ...c,
        _id: c._id.toString(),
        post_id: c.post_id.toString(),
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

      const doc = {
        post_id: postObjectId,
        author_name: user?.name ?? null,
        anonymous: !user,
        body: body.body,
        likes: 0,
        createdAt: new Date(),
      };

      const res = await comments.insertOne(doc);

      // increment comment count on the post
      await posts.updateOne(
        { _id: postObjectId },
        { $inc: { comments: 1 } }
      );

      try {
        await audits.insertOne({
          action: "comment.create",
          actor_user_id: user?._id ?? null,
          actor_name: user?.name ?? null,
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
      }),
    }
  )

  // -----------------------------
  // Get a single comment
  // -----------------------------
  .get(
    "/:id",
    async ({ params }) => {
      const c = await comments.findOne({ _id: new ObjectId(params.id) });
      if (!c) return new Response("Not found", { status: 404 });

      return {
        ...c,
        _id: c._id.toString(),
        post_id: c.post_id.toString(),
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
      const existing = await comments.findOne({ _id });
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
