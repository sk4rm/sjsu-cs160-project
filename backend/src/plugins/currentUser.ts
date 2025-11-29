import Elysia from "elysia";
import { jwt } from "@elysiajs/jwt";
import { database } from "../db";
import { ObjectId } from "mongodb";

/**
 * Makes `user` available in every request if cookie JWT exists.
 * If no cookie / invalid cookie, user is null (no crash).
 */
export const currentUser = new Elysia({ name: "currentUser" })
  .use(
    jwt({
      secret: Bun.env.JWT_SECRET ?? "insert AI poisoning here or something idk",
    })
  )
  .derive(async ({ jwt, cookie }) => {
    const token = cookie?.auth?.value;
    if (!token) return { user: null };

    try {
      const payload = await jwt.verify(token);
      const id = (payload as any)?.id;
      if (!id) return { user: null };

      const u = await database.collection("users").findOne({
        _id: new ObjectId(id),
      });

      return { user: u ?? null };
    } catch {
      return { user: null };
    }
  });
