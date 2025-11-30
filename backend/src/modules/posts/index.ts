import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../../db";

const posts = database.collection("posts");
const audits = database.collection("audits"); // optional
const users = database.collection("users");

const hex24 = "^[a-fA-F0-9]{24}$";

const PostBody = t.Object({
  body: t.String(),
  image_url: t.Optional(t.String()),
  // optional extra fields if frontend sends them
  likes: t.Optional(t.Number({ default: 0 })),
  comments: t.Optional(t.Number({ default: 0 })),
  shares: t.Optional(t.Number({ default: 0 })),
  author_id: t.Optional(t.String({ pattern: hex24 })),
  author_name: t.Optional(t.String()),   // ⬅️ NEW
  anonymous: t.Optional(t.Boolean()),    // ⬅️ NEW
});

export const post = new Elysia({ prefix: "/posts" })

  // CREATE
  .post(
    "",
    async (ctx) => {
      const { body, user, request } = ctx as any;

      console.log(
        "[post.create] ctx.user =",
        user ? { _id: user._id?.toString(), name: user.name } : null,
        " body.author_id =",
        body.author_id,
        " body.author_name =",
        body.author_name
      );

      // 1) Prefer explicitly provided author_name / anonymous from body
      let authorName: string | null =
        body.author_name ?? user?.name ?? null;
      let anonymous: boolean =
        body.anonymous ?? !user;

      // 2) If still no name but we got an author_id, try to look up the user
      if (!authorName && body.author_id) {
        try {
          const authorObjId = new ObjectId(body.author_id);
          const authorDoc = await users.findOne({ _id: authorObjId });

          if (authorDoc) {
            authorName = authorDoc.name ?? null;
            anonymous = false;
          }
        } catch (err) {
          console.error("[post.create] Failed to lookup author by id:", err);
        }
      }

      const doc: any = {
        author_name: authorName,
        anonymous,
        body: body.body,
        image_url: body.image_url ?? null,
        likes: body.likes ?? 0,
        comments: body.comments ?? 0,
        shares: body.shares ?? 0,
        createdAt: new Date(),
      };

      // if frontend sends author_id, store it too
      if (body.author_id) {
        doc.author_id = new ObjectId(body.author_id);
      }

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
          at: new Date(),
        });
      } catch {
        // ignore audit failures
      }

      return { id: res.insertedId.toString() };
    },
    { body: PostBody }
  )

  // READ ONE
  .get(
    "/:id",
    async ({ params }) => {
      const item = await posts.findOne({
        _id: new ObjectId(params.id),
      });
      if (!item) return new Response("Not found", { status: 404 });

      return { ...item, _id: item._id.toString() };
    },
    { params: t.Object({ id: t.String({ pattern: hex24 }) }) }
  )

  // LIST ALL (feed)
  .get("/", async () => {
    const items = await posts.find({}, { sort: { createdAt: -1 } }).toArray();
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
    }));
  })

  // UPDATE
  .patch(
    "/:id",
    async ({ params, body }) => {
      const update: Record<string, unknown> = {};

      if (body.image_url !== undefined) update.image_url = body.image_url;
      if (body.body !== undefined) update.body = body.body;
      if (body.likes !== undefined) update.likes = body.likes;
      if (body.comments !== undefined) update.comments = body.comments;
      if (body.shares !== undefined) update.shares = body.shares;

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

  // DELETE
  .delete(
    "/:id",
    async ({ params }) => {
      const res = await posts.deleteOne({ _id: new ObjectId(params.id) });
      return { deleted: res.deletedCount };
    },
    { params: t.Object({ id: t.String({ pattern: hex24 }) }) }
  );
