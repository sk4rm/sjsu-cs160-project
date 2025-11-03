import Elysia, { t } from "elysia";
import { database } from "../../db";
import { ObjectId } from "mongodb";

const db = database;

export const post = new Elysia({ prefix: "/posts" })
    .post("", ({ body }) => {
        return db
            .collection("posts")
            .insertOne({
                author_id: new ObjectId(body.author_id), image_url: body.image_url, body: body.body
            });
    }, {
        body: t.Object({
            author_id: t.String(), image_url: t.Optional(t.String()), body: t.String()
        })
    })

    .get("/:id", ({ params }) => {
        return db
            .collection("posts")
            .findOne({
                _id: new ObjectId(params.id)
            });
    }, {
        params: t.Object({
            id: t.String()
        })
    })

    .patch("/:id", async ({ params, body }) => {
        const query = { _id: new ObjectId(params.id) };
        const current_post = await db.collection("posts").findOne(query);
        const update = { $set: { ...current_post, ...body } };
        const options = {};

        return db
            .collection("posts")
            .updateOne(query, update, options);
    }, {
        params: t.Object({
            id: t.String()
        }), body: t.Object({
            image_url: t.Optional(t.String()), body: t.Optional(t.String())
        })
    })

    .delete("/:id", ({ params }) => {
        return db
            .collection("posts")
            .deleteOne({
                _id: new ObjectId(params.id)
            });
    }, {
        params: t.Object({
            id: t.String()
        })
    });
