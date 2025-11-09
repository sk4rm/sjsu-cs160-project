import Elysia, { t } from "elysia";
import { database } from "../../db";
import { ObjectId } from "mongodb";

const posts = database.collection("posts");

const PostBody = t.Object({
  author_id: t.String(),                  // Mongo _id string of the user
  image_url: t.Optional(t.String()),
  body: t.String(),                       // post text
  likes: t.Optional(t.Number({ default: 0 })),
  comments: t.Optional(t.Number({ default: 0 })),
  shares: t.Optional(t.Number({ default: 0 })),
});

export const post = new Elysia({ prefix: "/posts" })

  // CREATE
  .post(
    "",
    async ({ body }) => {
      const doc = {
        author_id: new ObjectId(body.author_id),
        image_url: body.image_url ?? null,
        body: body.body,
        likes: body.likes ?? 0,
        comments: body.comments ?? 0,
        shares: body.shares ?? 0,
        createdAt: new Date().toISOString(),
      };
      const res = await posts.insertOne(doc);
      return { id: res.insertedId.toString() };
    },
    { body: PostBody }
  )

  // READ ONE
  .get(
    "/:id",
    async ({ params }) => {
      const item = await posts.findOne({ _id: new ObjectId(params.id) });
      if (!item) return { notFound: true };
      return { ...item, _id: item._id.toString() };
    },
    { params: t.Object({ id: t.String() }) }
  )

  // LIST (for feed)
  .get(
    "/",
    async () => {
      const items = await posts.find({}, { sort: { createdAt: -1 } }).toArray();
      return items.map((p) => ({ ...p, _id: p._id.toString() }));
    }
  )

  // UPDATE (partial)
  .patch(
    "/:id",
    async ({ params, body }) => {
      const update: Record<string, unknown> = {};
      if (body.image_url !== undefined) update.image_url = body.image_url;
      if (body.body !== undefined) update.body = body.body;
      if (body.likes !== undefined) update.likes = body.likes;
      if (body.comments !== undefined) update.comments = body.comments;
      if (body.shares !== undefined) update.shares = body.shares;

      const res = await posts.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: update }
      );
      return { matched: res.matchedCount, modified: res.modifiedCount };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Partial(PostBody), // all optional for PATCH
    }
  )

  // DELETE
  .delete(
    "/:id",
    async ({ params }) => {
      const res = await posts.deleteOne({ _id: new ObjectId(params.id) });
      return { deleted: res.deletedCount };
    },
    { params: t.Object({ id: t.String() }) }
  );
import Elysia, { t } from "elysia";
import { database } from "../../db";
import { ObjectId } from "mongodb";

const posts = database.collection("posts");

const PostBody = t.Object({
  author_id: t.String(),                  // Mongo _id string of the user
  image_url: t.Optional(t.String()),
  body: t.String(),                       // post text
  likes: t.Optional(t.Number({ default: 0 })),
  comments: t.Optional(t.Number({ default: 0 })),
  shares: t.Optional(t.Number({ default: 0 })),
});

export const post = new Elysia({ prefix: "/posts" })

  // CREATE
  .post(
    "",
    async ({ body }) => {
      const doc = {
        author_id: new ObjectId(body.author_id),
        image_url: body.image_url ?? null,
        body: body.body,
        likes: body.likes ?? 0,
        comments: body.comments ?? 0,
        shares: body.shares ?? 0,
        createdAt: new Date().toISOString(),
      };
      const res = await posts.insertOne(doc);
      return { id: res.insertedId.toString() };
    },
    { body: PostBody }
  )

  // READ ONE
  .get(
    "/:id",
    async ({ params }) => {
      const item = await posts.findOne({ _id: new ObjectId(params.id) });
      if (!item) return { notFound: true };
      return { ...item, _id: item._id.toString() };
    },
    { params: t.Object({ id: t.String() }) }
  )

  // LIST (for feed)
  .get(
    "/",
    async () => {
      const items = await posts.find({}, { sort: { createdAt: -1 } }).toArray();
      return items.map((p) => ({ ...p, _id: p._id.toString() }));
    }
  )

  // UPDATE (partial)
  .patch(
    "/:id",
    async ({ params, body }) => {
      const update: Record<string, unknown> = {};
      if (body.image_url !== undefined) update.image_url = body.image_url;
      if (body.body !== undefined) update.body = body.body;
      if (body.likes !== undefined) update.likes = body.likes;
      if (body.comments !== undefined) update.comments = body.comments;
      if (body.shares !== undefined) update.shares = body.shares;

      const res = await posts.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: update }
      );
      return { matched: res.matchedCount, modified: res.modifiedCount };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Partial(PostBody), // all optional for PATCH
    }
  )

  // DELETE
  .delete(
    "/:id",
    async ({ params }) => {
      const res = await posts.deleteOne({ _id: new ObjectId(params.id) });
      return { deleted: res.deletedCount };
    },
    { params: t.Object({ id: t.String() }) }
  );
