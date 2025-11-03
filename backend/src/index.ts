import { Elysia, file, t } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { ObjectId } from "mongodb";
import { cors } from "@elysiajs/cors";
import { database } from "./db";
import { auth } from "./modules/auth";

const db = database;

const app = new Elysia()
    .use(staticPlugin())

    .use(
        cors({
            origin: "http://localhost:5173",
            credentials: true
        })
    )

    .use(
        openapi({
            exclude: {
                paths: ["/public/*"]
            }
        })
    )

    .get("/favicon.ico", () => file("favicon.ico"))

    .group("/api", (api) => api

        .use(auth)

        .group("/posts", (posts) => posts

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
            }))

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
            }))

    )

    .listen(3000);

console.info(`🍂 Eco-Leveling backend is running at http://${app.server?.hostname}:${app.server?.port}`);
console.info(`🔌 Please refer to API documentation at http://${app.server?.hostname}:${app.server?.port}/openapi`);
