import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../../db";

const db = database;
const commentsCol = db.collection("comments");
const postsCol = db.collection("posts");

const hex24 = "^[a-fA-F0-9]{24}$";
const oid = (s: string) => new ObjectId(s);

export const comments = new Elysia({ prefix: "/comments" })
  .get("/by-post/:postId", async ({ params }) => {
    const list = await commentsCol
      .find({ post_id: oid(params.postId) })
      .sort({ createdAt: 1 })
      .toArray();
    return list.map(c => ({ ...c, _id: c._id.toString() }));
  }, { params: t.Object({ postId: t.String({ pattern: hex24 }) }) })

  .post("", async ({ body, cookie }) => {
    let author_name: string | null = null;
    let anonymous = true;

    try {
      const raw = cookie?.auth_user?.value;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.name && typeof parsed.name === "string") {
          author_name = parsed.name;
          anonymous = false;
        }
      }
    } catch {}

    const doc = {
      post_id: oid(body.post_id),
      author_name,
      anonymous,
      body: body.body,
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    const res = await commentsCol.insertOne(doc);
    await postsCol.updateOne({ _id: oid(body.post_id) }, { $inc: { comments: 1 } });
    return { id: res.insertedId.toString() };
  }, { body: t.Object({ post_id: t.String({ pattern: hex24 }), body: t.String() }) })

  .get("/:id", async ({ params }) => {
    const c = await commentsCol.findOne({ _id: oid(params.id) });
    return c ? { ...c, _id: c._id.toString() } : { notFound: true };
  }, { params: t.Object({ id: t.String({ pattern: hex24 }) }) })

  .patch("/:id", async ({ params, body }) => {
    const res = await commentsCol.updateOne(
      { _id: oid(params.id) },
      { $set: { body: body.body } }
    );
    return { matched: res.matchedCount, modified: res.modifiedCount };
  }, {
    params: t.Object({ id: t.String({ pattern: hex24 }) }),
    body: t.Object({ body: t.String() })
  })

  .delete("/:id", async ({ params }) => {
    const res = await commentsCol.deleteOne({ _id: oid(params.id) });
    return { deleted: res.deletedCount };
  }, { params: t.Object({ id: t.String({ pattern: hex24 }) }) });
