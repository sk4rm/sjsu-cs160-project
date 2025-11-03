import { status } from "elysia";
import { database } from "../../db";
import { AuthModel } from "./model";

const users = database.collection("users");

export abstract class Auth {
    /**
     * Registers a new user with the specified name, password, and an optional profile picture URL.
     * @returns User ID if registration was successful.
     */
    static async register({ name, password, profile_pic_url }: AuthModel.RegistrationBody) {
        const isNameTaken = await users.findOne({ name: name });
        if (isNameTaken) {
            throw status(
                409,
                {
                    message: "User already exists"
                } satisfies AuthModel.RegistrationError
            );
        }

        const userData = {
            name: name,
            password: await Bun.password.hash(password),
            points: 0,
            is_moderator: false,

            // Only add this field if supplied to eliminate null fields.
            ...(profile_pic_url && { profile_pic_url: profile_pic_url })
        };

        console.info(`Creating new user ${name}...`);

        const result = await users.insertOne(userData);

        console.info(`Created a new user with ID: ${result.insertedId}`);

        return {
            id: result.insertedId.toString()
        };
    }
}