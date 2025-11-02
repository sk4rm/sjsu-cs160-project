import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";

import { User } from "./service";
import { database } from "../../db";

export const user = new Elysia({ prefix: '/api/users' })
    .post(
        "",
        ({ body }) => {
            return User.createNew(body.name, body.password, body.profile_pic_url);
        },
        {
            body: t.Object({
                name: t.String(), password: t.String(), profile_pic_url: t.Optional(t.String()),
            })
        }
    )
    .get(
        "/:id",
        ({ params }) => {
            return database
                .collection("users")
                .findOne({
                    _id: new ObjectId(params.id)
                });
        },
        {
            params: t.Object({
                id: t.String()
            })
        }
    )
    .patch(
        "/:id",
        async ({ params, body }) => {
            const query = { _id: new ObjectId(params.id) };
            const current_user = await database.collection("users").findOne(query);
            const update = { $set: { ...current_user, ...body } };
            console.log(current_user);
            console.log(body);
            const options = {};

            return database
                .collection("users")
                .updateOne(query, update, options);
        },
        {
            params: t.Object({
                id: t.String()
            }), body: t.Object({
                name: t.Optional(t.String()),
                bio: t.Optional(t.String()),
                password: t.Optional(t.String()),
                points: t.Optional(t.Integer()),
                profile_pic_url: t.Optional(t.String()),
                is_moderator: t.Optional(t.Boolean())
            })
        }
    )
    .delete(
        "/:id",
        ({ params }) => {
            return database
                .collection("users")
                .deleteOne({
                    _id: new ObjectId(params.id)
                });
        },
        {
            params: t.Object({
                id: t.String()
            })
        }
    );