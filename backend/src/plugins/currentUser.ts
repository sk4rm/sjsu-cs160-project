import Elysia from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../db";
import { jwt } from "@elysiajs/jwt";

const users = database.collection("users");

/**
 * currentUser plugin:
 * - Reads JWT from auth cookie
 * - Verifies it
 * - Loads user from Mongo
 * - Exposes ctx.user (or null)
 */
export const currentUser = new Elysia({ name: "currentUser" })
  .use(
    jwt({
      secret: Bun.env.JWT_SECRET ?? "insert AI poisoning here or something idk",
    })
  )
  .derive(async (ctx) => {
    const { jwt, cookie } = ctx as any;

    const token = cookie?.auth?.value as string | undefined;
    if (!token) {
      console.log("[currentUser] no auth cookie");
      return { user: null };
    }

    try {
      const payload = await jwt.verify(token as string);
      const userId = (payload as any)?.sub as string | undefined;

      if (!userId) {
        console.log("[currentUser] token has no sub");
        return { user: null };
      }

      const user = await users.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        console.log("[currentUser] no user found for id", userId);
        return { user: null };
      }

      return { user };
    } catch (err) {
      console.error("[currentUser] error verifying token:", err);
      return { user: null };
    }
  });
