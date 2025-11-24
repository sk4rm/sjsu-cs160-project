import Elysia, { t } from "elysia";
import { database } from "../../db";
import { ObjectId } from "mongodb";

const postsCol = database.collection("posts");

const CreatePostBody = t.Object({
  image_url: t.Optional(t.String()),
  body: t.String(),
});
const UpdatePostBody = t.Partial(CreatePostBody);

export const posts = new Elysia({ prefix: "/posts" })
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
      author_name,
      anonymous,
      image_url: body.image_url ?? null,
      body: body.body,
      likes: 0,
      comments: 0,
      shares: 0,
      createdAt: new Date().toISOString(),
    };

    const res = await postsCol.insertOne(doc);
    return { id: res.insertedId.toString() };
  }, { body: CreatePostBody })

  .get("/:id", async ({ params }) => {
    const item = await postsCol.findOne({ _id: new ObjectId(params.id) });
    if (!item) return { notFound: true };
    return { ...item, _id: item._id.toString() };
  }, { params: t.Object({ id: t.String() }) })

  .get("/", async () => {
    const items = await postsCol.find({}, { sort: { createdAt: -1 } }).toArray();
    return items.map(p => ({ ...p, _id: p._id.toString() }));
  })

  .patch("/:id", async ({ params, body }) => {
    const update: Record<string, unknown> = {};
    if (body.image_url !== undefined) update.image_url = body.image_url;
    if (body.body !== undefined) update.body = body.body;
    const res = await postsCol.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: update }
    );
    return { matched: res.matchedCount, modified: res.modifiedCount };
  }, { params: t.Object({ id: t.String() }), body: UpdatePostBody })

  .delete("/:id", async ({ params }) => {
    const res = await postsCol.deleteOne({ _id: new ObjectId(params.id) });
    return { deleted: res.deletedCount };
  }, { params: t.Object({ id: t.String() }) });
