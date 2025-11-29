import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";

import { User } from "./service";
import { database } from "../../db";
import { UserModel } from "./model";

import { leaderboard } from "./leaderboard";  // <-- added

export const user = new Elysia({ prefix: '/users' })

    // CREATE USER
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

    // GET USER BY ID
    .get(
        "/:id",
        ({ params: { id } }) => {
            return User.find(id); 
        },
        {
            params: UserModel.id,
        }
    )

    // UPDATE USER
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

    // DELETE USER
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
    )

    // REGISTER LEADERBOARD ROUTE
    .use(leaderboard);   // <-- added
