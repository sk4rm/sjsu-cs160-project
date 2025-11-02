import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";

import { User } from "./service";
import { database } from "../../db";
import { UserModel } from "./model";

export const user = new Elysia({ prefix: '/api/users' })
    .post(
        "",
        ({ body }) => {
            return User.createNew(
                body.name,
                body.password,
                body.profile_pic_url
            );
        },
        {
            body: UserModel.registrationBody
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
            params: UserModel.id
        }
    )
    .patch(
        "/:id",
        async ({ params, body }) => {
            const query = { _id: new ObjectId(params.id) };
            const current_user = await database
                .collection("users")
                .findOne(query);

            const update = { $set: { ...current_user, ...body } };
            const options = {};

            return database
                .collection("users")
                .updateOne(query, update, options);
        },
        {
            params: UserModel.id,
            body: UserModel.patchBody
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
            params: UserModel.id,
        }
    );