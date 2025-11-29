import Elysia, { t } from "elysia";
import { database } from "../../db";

const posts = database.collection("posts");
const audits = database.collection("audits"); // optional

export const post = new Elysia({ prefix: "/posts" })

  .post(
    "",
    async ({ body, user, request }) => {
      const doc = {
        author_name: user?.name ?? null,
        anonymous: !user,
        body: body.body,
        image_url: body.image_url ?? null,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date()
      };

      const res = await posts.insertOne(doc);

      try {
        await audits.insertOne({
          action: "post.create",
          actor_user_id: user?._id ?? null,
          actor_name: user?.name ?? null,
          target: { collection: "posts", id: res.insertedId },
          ip:
            request?.headers.get("x-forwarded-for") ??
            request?.headers.get("cf-connecting-ip") ??
            null,
          ua: request?.headers.get("user-agent") ?? null,
          at: new Date()
        });
      } catch {}

      return { id: res.insertedId.toString() };
    },
    {
      body: t.Object({
        body: t.String(),
        image_url: t.Optional(t.String())
      })
    }
  )

  .get(
    "/:id",
    async ({ params }) => {
      const item = await posts.findOne({
        _id: new database.bson.ObjectId(params.id),
      });
      if (!item) return new Response("Not found", { status: 404 });
      return { ...item, _id: item._id.toString() };
    },
    { params: t.Object({ id: t.String() }) }
  )

  .get("/", async () => {
    const items = await posts.find({}, { sort: { createdAt: -1 } }).toArray();
    return items.map((p) => ({
      _id: p._id.toString(),
      author_name: p.author_name,
      anonymous: !!p.anonymous,
      body: p.body,
      image_url: p.image_url ?? null,
      likes: p.likes ?? 0,
      comments: p.comments ?? 0,
      shares: p.shares ?? 0,
      createdAt: p.createdAt
    }));
  })

  .patch(
    "/:id",
    async ({ params, body, user }) => {
      const _id = new database.bson.ObjectId(params.id);
      const $set: Record<string, unknown> = {};

      if (body.image_url !== undefined) $set.image_url = body.image_url;
      if (body.body !== undefined) $set.body = body.body;
      if (body.likes !== undefined) $set.likes = body.likes;
      if (body.comments !== undefined) $set.comments = body.comments;
      if (body.shares !== undefined) $set.shares = body.shares;

      if (!Object.keys($set).length) return { matched: 0, modified: 0 };

      const res = await posts.updateOne({ _id }, { $set });

      return { matched: res.matchedCount, modified: res.modifiedCount };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        image_url: t.Optional(t.String()),
        body: t.Optional(t.String()),
        likes: t.Optional(t.Number()),
        comments: t.Optional(t.Number()),
        shares: t.Optional(t.Number())
      })
    }
  )

  .delete(
    "/:id",
    async ({ params }) => {
      const _id = new database.bson.ObjectId(params.id);
      const res = await posts.deleteOne({ _id });
      return { deleted: res.deletedCount };
    },
    { params: t.Object({ id: t.String() }) }
  );
