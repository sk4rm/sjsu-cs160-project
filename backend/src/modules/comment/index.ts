import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../../db";

const comments = database.collection("comments");
const audits = database.collection("audits");

const hex24 = "^[a-fA-F0-9]{24}$";
const oid = (s: string) => new ObjectId(s);

export const commentsModule = new Elysia({ prefix: "/comments" })

  // -------------------------
  // List comments for a post
  // -------------------------
  .get(
    "/by-post/:postId",
    async ({ params }) => {
      const list = await comments
        .find({ post_id: oid(params.postId) })
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
        postId: t.String({ pattern: hex24 }),
      }),
    }
  )

  // -------------------------
  // Create a comment
  // -------------------------
  .post(
    "",
    async (ctx) => {
      const { body, user, request } = ctx as any;

      const doc: any = {
        post_id: oid(body.post_id),
        author_name: user?.name ?? null,
        anonymous: !user,
        body: body.body,
        likes: 0,
        createdAt: new Date(),
      };

      // If frontend sends author_id, store it too
      if (body.author_id) {
        doc.author_id = oid(body.author_id);
      }

      const res = await comments.insertOne(doc);

      try {
        await audits.insertOne({
          action: "comment.create",
          actor_user_id: user?._id ?? null,
          actor_name: user?.name ?? null,
          post_target: body.post_id,
          target: { collection: "comments", id: res.insertedId },
          ip:
            request.headers.get("x-forwarded-for") ??
            request.headers.get("cf-connecting-ip") ??
            null,
          ua: request.headers.get("user-agent"),
          at: new Date(),
        });
      } catch {
        // audit failures shouldn't break comment creation
      }

      return { id: res.insertedId.toString() };
    },
    {
      body: t.Object({
        post_id: t.String({ pattern: hex24 }),
        body: t.String(),
        author_id: t.Optional(t.String({ pattern: hex24 })),
      }),
    }
  )

  // -------------------------
  // Get a single comment
  // -------------------------
  .get(
    "/:id",
    async ({ params }) => {
      const c = await comments.findOne({ _id: oid(params.id) });
      if (!c) return new Response("Not found", { status: 404 });

      return {
        ...c,
        _id: c._id.toString(),
        post_id: c.post_id.toString(),
        author_id: (c as any).author_id
          ? (c as any).author_id.toString()
          : undefined,
      };
    },
    { params: t.Object({ id: t.String({ pattern: hex24 }) }) }
  )

  // -------------------------
  // Update a comment
  // -------------------------
  .patch(
    "/:id",
    async (ctx) => {
      const { params, body, user } = ctx as any;

      const _id = oid(params.id);
      const update: { $set: any } = { $set: {} };

      if (body.body !== undefined) update.$set.body = body.body;

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
      } catch {
        // ignore audit failure
      }

      return { matched: res.matchedCount, modified: res.modifiedCount };
    },
    {
      params: t.Object({ id: t.String({ pattern: hex24 }) }),
      body: t.Object({ body: t.Optional(t.String()) }),
    }
  )

  // -------------------------
  // Delete a comment
  // -------------------------
  .delete(
    "/:id",
    async (ctx) => {
      const { params, user } = ctx as any;

      const _id = oid(params.id);
      const res = await comments.deleteOne({ _id });

      try {
        await audits.insertOne({
          action: "comment.delete",
          actor_user_id: user?._id ?? null,
          actor_name: user?.name ?? null,
          target: { collection: "comments", id: _id },
          at: new Date(),
        });
      } catch {
        // ignore audit failure
      }

      return { deleted: res.deletedCount };
    },
    { params: t.Object({ id: t.String({ pattern: hex24 }) }) }
  );
