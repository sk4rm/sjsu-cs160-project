import { database } from "../../db";

export abstract class User {
    static async createNew(name: string, password: string, profile_pic_url?: string) {
        const userData = {
            name: name,
            password: await Bun.password.hash(password),
            points: 0,
            is_moderator: false,

            // Only add this field if supplied to eliminate null fields.
            ...(profile_pic_url && { profile_pic_url: profile_pic_url })
        };

        console.info(`Creating new user: ${name}`);

        const result = await database
            .collection("users")
            .insertOne(userData);

        console.info(`Created new user with ID: ${result.insertedId}`);

        return result;
    }
}