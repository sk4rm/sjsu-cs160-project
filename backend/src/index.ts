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

        .group("/users", (users_api) => users_api

            .post("/", ({ body }) => {
                return db
                    .collection("users")
                    .insertOne({
                        name: body.name,
                        bio: body.bio,
                        password: body.password,
                        points: body.points,
                        profile_pic_url: body.profile_pic_url,
                        is_moderator: body.is_moderator
                    });
            }, {
                body: t.Object({
                    name: t.String(),
                    bio: t.Optional(t.String()),
                    password: t.String(),
                    points: t.Optional(t.Integer()),
                    profile_pic_url: t.Optional(t.String()),
                    is_moderator: t.Optional(t.Boolean())
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

            .patch("/:id", ({ params, body }) => {
                const query = { _id: new ObjectId(params.id) };
                const update = {
                    $set: {
                        name: body.name
                    }
                };
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

    )

    .listen(3000);

console.info(`🍂 Eco-Leveling backend is running at http://${app.server?.hostname}:${app.server?.port}`);
console.info(`⚙️ Please refer to API documentation at http://${app.server?.hostname}:${app.server?.port}/openapi`);
