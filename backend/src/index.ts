import {Elysia, file, t} from "elysia";
import {openapi} from "@elysiajs/openapi";
import {staticPlugin} from "@elysiajs/static";
import {MongoClient, ObjectId, ServerApiVersion} from "mongodb";

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
        .post("/users", ({body}) => {
            return db
                .collection("users")
                .insertOne({name: body.name});
        }, {
            body: t.Object({
                name: t.String()
            })
        })

        .get("/users/:id", ({params}) => {
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

        .patch("/users/:id", ({params, body}) => {
            const query = {_id: new ObjectId(params.id)};
            const update = {
                $set: {
                    name: body.name,
                }
            };
            const options = {};

            return db
                .collection("users")
                .updateOne(query, update, options);
        }, {
            params: t.Object({id: t.String()}), body: t.Object({
                name: t.String()
            })
        })

        .delete("/users/:id", ({params}) => {
            return db
                .collection("users")
                .deleteOne({
                    _id: new ObjectId(params.id)
                });
        }, {
            params: t.Object({
                id: t.String()
            })
        }))

    .listen(3000);

console.info(`🍂 Eco-Leveling backend is running at http://${app.server?.hostname}:${app.server?.port}`);
console.info(`⚙️ Please refer to API documentation at http://${app.server?.hostname}:${app.server?.port}/openapi`);


//tester
// import { Elysia } from 'elysia'

// const app = new Elysia()

// app.get('/api/user', () => ({
//   name: 'Eco',
//   role: 'developer'
// }))

// app.listen(3000)
// console.log('🦊 Elysia running on http://localhost:3000')
