import Elysia, { t } from "elysia";
import { database } from "../../db";

const posts = database.collection("posts");
// Optional: keep an audit trail of who did what
const audits = database.collection("audits");

export const post = new Elysia({ prefix: "/posts" })

  // CREATE a post (no author_id; derive name from cookie/session)
  .post(
    "",
    async ({ body, user, request }) => {
      const doc = {
        author_name: user?.name ?? null,   // what you show publicly
        anonymous: !user,                  // quick flag for UI/filters
        body: body.body,
        image_url: body.image_url ?? null,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date()
      };

      const res = await posts.insertOne(doc);

      // OPTIONAL: write audit record
      try {
        await audits.insertOne({
          action: "post.create",
          actor_user_id: user?._id ?? null,
          actor_name: user?.name ?? null,
          target: { collection: "posts", id: res.insertedId },
          ip: request?.headers.get("x-forwarded-for") ?? request?.headers.get("cf-connecting-ip") ?? null,
          ua: request?.headers.get("user-agent") ?? null,
          at: new Date()
        });
      } catch { /* ignore audit failure */ }

      return { id: res.insertedId.toString() };
    },
    {
      body: t.Object({
        body: t.String(),
        image_url: t.Optional(t.String())
      })
    }
  )

  // READ ONE
  .get(
    "/:id",
    async ({ params }) => {
      const item = await posts.findOne({ _id: new database.bson.ObjectId(params.id) });
      if (!item) return new Response("Not found", { status: 404 });
      return { ...item, _id: item._id.toString() };
    },
    { params: t.Object({ id: t.String() }) }
  )

  // LIST feed (newest first)
  .get("/", async () => {
    const items = await posts
      .find({}, { sort: { createdAt: -1 } })
      .toArray();

    return items.map((p) => ({
      _id: p._id.toString(),
      author_name: p.author_name,   // string | null
      anonymous: !!p.anonymous,     // boolean
      body: p.body,
      image_url: p.image_url ?? null,
      likes: p.likes ?? 0,
      comments: p.comments ?? 0,
      shares: p.shares ?? 0,
      createdAt: p.createdAt
    }));
  })

  // UPDATE (no author_id in schema)
  .patch(
    "/:id",
    async ({ params, body, user, request }) => {
      const _id = new database.bson.ObjectId(params.id);
      const $set: Record<string, unknown> = {};

      if (body.image_url !== undefined) $set.image_url = body.image_url;
      if (body.body !== undefined) $set.body = body.body;
      if (body.likes !== undefined) $set.likes = body.likes;
      if (body.comments !== undefined) $set.comments = body.comments;
      if (body.shares !== undefined) $set.shares = body.shares;

      if (!Object.keys($set).length) return { matched: 0, modified: 0 };

      const res = await posts.updateOne({ _id }, { $set });

      // OPTIONAL: audit
      try {
        await audits.insertOne({
          action: "post.update",
          actor_user_id: user?._id ?? null,
          actor_name: user?.name ?? null,
          target: { collection: "posts", id: _id },
          changes: Object.keys($set),
          at: new Date()
        });
      } catch {}

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

  // DELETE
  .delete(
    "/:id",
    async ({ params, user, request }) => {
      const _id = new database.bson.ObjectId(params.id);
      const res = await posts.deleteOne({ _id });

      // OPTIONAL: audit
      try {
        await audits.insertOne({
          action: "post.delete",
          actor_user_id: user?._id ?? null,
          actor_name: user?.name ?? null,
          target: { collection: "posts", id: _id },
          at: new Date()
        });
      } catch {}

      return { deleted: res.deletedCount };
    },
    { params: t.Object({ id: t.String() }) }
  );
