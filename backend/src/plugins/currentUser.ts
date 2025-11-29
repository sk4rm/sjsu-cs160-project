import Elysia from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../db";

const users = database.collection("users");

/**
 * currentUser plugin:
 * - Reads JWT from auth cookie
 * - Verifies it
 * - Loads user from Mongo
 * - Exposes ctx.user (or null)
 */
export const currentUser = new Elysia({ name: "currentUser" }).derive(
  async (ctx) => {
    const { jwt, cookie } = ctx as any;

    const token = cookie?.auth?.value as string | undefined;
    if (!token) return { user: null };

    try {
      const payload = await jwt.verify(token as string);
      const userId = (payload as any)?.sub as string | undefined;

      if (!userId) return { user: null };

      const user = await users.findOne({ _id: new ObjectId(userId) });
      return { user };
    } catch {
      // if token invalid/expired, just treat as not logged in
      return { user: null };
    }
  }
);
