import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../../db";

const comments = database.collection("comments");
const audits = database.collection("audits");

export const commentsModule = new Elysia({ prefix: "/comments" })

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

  .post(
    "",
    async ({ body, user, request }) => {
      const doc = {
        post_id: new ObjectId(body.post_id),
        author_name: user?.name ?? null,
        anonymous: !user,
        body: body.body,
        likes: 0,
        createdAt: new Date(),
      };

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
      } catch {}

      return { id: res.insertedId.toString() };
    },
    {
      body: t.Object({
        post_id: t.String({ pattern: "^[a-fA-F0-9]{24}$" }),
        body: t.String(),
      }),
    }
  )

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
    { params: t.Object({ id: t.String({ pattern: "^[a-fA-F0-9]{24}$" }) }) }
  )

  .patch(
    "/:id",
    async ({ params, body, user }) => {
      const _id = new ObjectId(params.id);
      const update = { $set: {} as any };

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
      } catch {}

      return { matched: res.matchedCount, modified: res.modifiedCount };
    },
    {
      params: t.Object({ id: t.String({ pattern: "^[a-fA-F0-9]{24}$" }) }),
      body: t.Object({ body: t.Optional(t.String()) }),
    }
  )

  .delete(
    "/:id",
    async ({ params, user }) => {
      const _id = new ObjectId(params.id);
      const res = await comments.deleteOne({ _id });

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
    { params: t.Object({ id: t.String({ pattern: "^[a-fA-F0-9]{24}$" }) }) }
  );
