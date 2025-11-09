import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../../db";

const db = database;
const hex24 = "^[a-fA-F0-9]{24}$";
const oid = (s: string) => new ObjectId(s);

export const comments = new Elysia({ prefix: "/comments" })

  // List comments for a post (oldest → newest)
  .get("/by-post/:postId", async ({ params }) => {
    return db
      .collection("comments")
      .find({ post_id: oid(params.postId) })
      .sort({ createdAt: 1 })
      .toArray();
  }, {
    params: t.Object({ postId: t.String({ pattern: hex24 }) })
  })

  // Create a comment
  .post("", async ({ body }) => {
    const doc = {
      post_id: oid(body.post_id),
      author_id: oid(body.author_id),
      body: body.body,
      likes: 0,
      createdAt: new Date()
    };
    const res = await db.collection("comments").insertOne(doc);
    return { id: res.insertedId };
  }, {
    body: t.Object({
      post_id: t.String({ pattern: hex24 }),
      author_id: t.String({ pattern: hex24 }),
      body: t.String()
    })
  })

  // (Optional endpoints you already had)
  .get("/:id", async ({ params }) =>
    db.collection("comments").findOne({ _id: oid(params.id) })
  , { params: t.Object({ id: t.String({ pattern: hex24 }) }) })

  .patch("/:id", async ({ params, body }) =>
    db.collection("comments").updateOne(
      { _id: oid(params.id) },
      { $set: { body: body.body } }
    )
  , {
    params: t.Object({ id: t.String({ pattern: hex24 }) }),
    body: t.Object({ body: t.String() })
  })

  .delete("/:id", async ({ params }) =>
    db.collection("comments").deleteOne({ _id: oid(params.id) })
  , { params: t.Object({ id: t.String({ pattern: hex24 }) }) });
