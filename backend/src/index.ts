import { Elysia, file, t } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { ObjectId } from "mongodb";
import { cors } from "@elysiajs/cors";
import { database } from "./db";
import { User } from "./modules/user/service";
import { user } from "./modules/user";

const db = database;

const app = new Elysia()
    .use(staticPlugin())

    .use(cors({ origin: "http://localhost:5173", credentials: true }))

    .use(openapi({
        exclude: {
            paths: ["/public/*"]
        }
    }))

    .get("/favicon.ico", () => file("favicon.ico"))

    .use(user)

    .group("/api", (api) => api

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

        .group("/auth", (auth) => auth
            // Register (plain for now)
            .post("/register", async ({ body, set }) => {
                const exists = await db.collection("users").findOne({ name: body.name });
                if (exists) {
                    set.status = 409;
                    return { error: "User already exists" };
                }

                const result = await User.createNew(body.name, body.password, body.profile_pic_url);
                const user = await db.collection("users").findOne({ _id: result.insertedId });
                return { id: user!._id.toString(), name: user!.name, profile_pic_url: user!.profile_pic_url };
            }, {
                body: t.Object({
                    name: t.String({ minLength: 3 }),
                    password: t.String({ minLength: 3 }),
                    profile_pic_url: t.Optional(t.String())
                })
            })

            // Login (plain compare)
            .post("/login", async ({ body, set }) => {
                const user = await db.collection("users").findOne({ name: body.name });
                if (!user || !Bun.password.verifySync(body.password, user.password)) {
                    set.status = 401;
                    return { error: "Invalid credentials" };
                }
                return { id: user._id.toString(), name: user.name, profile_pic_url: user.profile_pic_url };
            }, {
                body: t.Object({
                    name: t.String(), password: t.String()
                })
            })))

    .listen(3000);

console.info(`🍂 Eco-Leveling backend is running at http://${app.server?.hostname}:${app.server?.port}`);
console.info(`🔌 Please refer to API documentation at http://${app.server?.hostname}:${app.server?.port}/openapi`);
