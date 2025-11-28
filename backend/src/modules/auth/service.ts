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

  static async login({ name, password }: AuthModel.LoginBody) {
    console.info(`Attempting to login user "${name}"...`);

    const user = await users.findOne({ name: name });

    if (user) {
      console.info("Verifying credentials...");

      const hash = user.password;
      const match = await Bun.password.verify(password, hash);

      if (match) {
        console.info(`User "${name}" successfully authenticated!`);

        return {
          id: user._id.toString(),
          name: user.name,
          // only add if exists
          ...(user.profile_pic_url && { profile_pic_url: user.profile_pic_url }),
          // ⭐ NEW: pass through moderator flag from Mongo
          is_moderator: !!user.is_moderator
        } satisfies AuthModel.LoginResponse;
      } else {
        console.error("Password hash does not match.");
      }
    } else {
      console.error(`Couldn't find user "${name}" in database.`);
    }

    // 🔁 Small fix: use LoginError instead of RegistrationError
    throw status(
      401,
      {
        message: "Invalid credentials"
      } satisfies AuthModel.LoginError
    );
  }
}
