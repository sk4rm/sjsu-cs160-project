import { Elysia, file, t } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

if (Bun.env.URI_MONGO === undefined) {
    throw new Error("Environment variable URI_MONGO not specified.");
}

const client = new MongoClient(Bun.env.URI_MONGO, {
    serverApi: {
        version: ServerApiVersion.v1, strict: true, deprecationErrors: true
    }
});
const db = client.db("eco-leveling");

const app = new Elysia()
    .use(staticPlugin())

    .use(openapi({
        exclude: {
            paths: ["/public/*"]
        }
    }))

    .get("/favicon.ico", () => file("favicon.ico"))

    .group("/api", (api) => api

        .group("/users", (users) => users

            .post("/", ({ body }) => {
                return db
                    .collection("users")
                    .insertOne({
                        name: body.name,
                        password: body.password,
                        profile_pic_url: body.profile_pic_url,
                        points: 0,
                        is_moderator: false
                    });
            }, {
                body: t.Object({
                    name: t.String(),
                    password: t.String(),
                    profile_pic_url: t.Optional(t.String()),
                })
            })

            .get("/:id", ({ params }) => {
                return db
                    .collection("users")
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
                const current_user = await db.collection("users").findOne(query);
                const update = { $set: { ...current_user, ...body } };
                console.log(current_user);
                console.log(body);
                const options = {};

                return db
                    .collection("users")
                    .updateOne(query, update, options);
            }, {
                params: t.Object({
                    id: t.String()
                }),
                body: t.Object({
                    name: t.Optional(t.String()),
                    bio: t.Optional(t.String()),
                    password: t.Optional(t.String()),
                    points: t.Optional(t.Integer()),
                    profile_pic_url: t.Optional(t.String()),
                    is_moderator: t.Optional(t.Boolean())
                })
            })

            .delete("/:id", ({ params }) => {
                return db
                    .collection("users")
                    .deleteOne({
                        _id: new ObjectId(params.id)
                    });
            }, {
                params: t.Object({
                    id: t.String()
                })
            })

        )

        .group("/posts", (posts) => posts

            .post("/", ({ body }) => {
                return db
                    .collection("posts")
                    .insertOne({
                        image_url: body.image_url,
                        body: body.body
                    });
            }, {
                body: t.Object({
                    image_url: t.Optional(t.String()),
                    body: t.String()
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
                }),
                body: t.Object({
                    image_url: t.Optional(t.String()),
                    body: t.Optional(t.String())
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
            })

        )

        .group("/comments", (comments) => comments)

    )

    .listen(3000);

console.info(`🍂 Eco-Leveling backend is running at http://${app.server?.hostname}:${app.server?.port}`);
console.info(`⚙️ Please refer to API documentation at http://${app.server?.hostname}:${app.server?.port}/openapi`);
