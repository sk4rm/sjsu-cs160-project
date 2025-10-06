import { Elysia, file, t } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

if (Bun.env.URI_MONGO === undefined) {
    throw new Error("Environment variable URI_MONGO not specified.");
}

const client = new MongoClient(Bun.env.URI_MONGO, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
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

    .group("/api", (api) =>
        api
            .get("/users/:id", ({ params }) => {
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

            // Test with
            // `irm -Uri http://127.0.0.1:3000/api/users -Method POST -ContentType "application/json" -Body (ConvertTo-Json -InputObject @{ name = "Jane Doe"  })`
            .post("/users", ({ body }) => {
                return db
                    .collection("users")
                    .insertOne({ name: body.name });
            }, {
                body: t.Object({
                    name: t.String()
                })
            })
    )

    .listen(3000);

console.info(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
