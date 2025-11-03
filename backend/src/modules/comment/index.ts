import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../../db";

const db = database;

export const comments = new Elysia({ prefix: "/comments" })
    .group("/comments", (comments) => comments

        .post("", ({ body }) => {
            // TODO Validate post_id and author_id; disable commenting on non-existent posts by non-existent users.
            return db
                .collection("comments")
                .insertOne({
                    post_id: new ObjectId(body.post_id),
                    author_id: new ObjectId(body.author_id),
                    body: body.body,
                    likes: 0
                });
        }, {
            body: t.Object({
                post_id: t.String(), author_id: t.String(), body: t.String()
            })
        })

        .get("/:id", ({ params }) => {
            return db
                .collection("comments")
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
            const update = { $set: { body: body.body } };
            const options = {};

            return db
                .collection("comments")
                .updateOne(query, update, options);
        }, {
            params: t.Object({
                id: t.String()
            }), body: t.Object({
                body: t.Optional(t.String()),
            })
        })

        .delete("/:id", ({ params }) => {
            return db
                .collection("comments")
                .deleteOne({ _id: new ObjectId(params.id) });
        }, {
            params: t.Object({
                id: t.String()
            })
        }));