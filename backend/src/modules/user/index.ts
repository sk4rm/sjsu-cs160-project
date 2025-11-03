import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";

import { User } from "./service";
import { database } from "../../db";
import { UserModel } from "./model";

export const user = new Elysia({ prefix: '/users' })
    .post(
        "",
        async ({ body: { name, password, profile_pic_url } }) => {
            const response = await User.createNew(name, password, profile_pic_url);
            return response;
        },
        {
            body: UserModel.registrationBody
        }
    )
    .get(
        "/:id",
        ({ params: { id } }) => {
            return User.find(id);
        },
        {
            params: UserModel.id,
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