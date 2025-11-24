import { Elysia } from "elysia";
import { database } from "../db";
import { ObjectId } from "mongodb";

const users = database.collection("users");

export const currentUser = new Elysia().derive(async ({ cookie }) => {
    const id = cookie.auth_user_id?.value;

    if (!id) return { user: null };

    const user = await users.findOne(
        { _id: new ObjectId(id) },
        { projection: { name: 1 } }
    );

    return {
        user: user ? { _id: id, name: user.name } : null
    };
});
