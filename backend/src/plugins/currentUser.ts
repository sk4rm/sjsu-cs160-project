import Elysia from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../db";
import { jwt } from "@elysiajs/jwt";

const users = database.collection("users");

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
      return { user: null };
    }

    try {
      const payload = await jwt.verify(token);
      const userId = (payload as any)?.sub as string | undefined;

      if (!userId) return { user: null };

      const user = await users.findOne({ _id: new ObjectId(userId) });
      if (!user) return { user: null };

      return { user };
    } catch {
      return { user: null };
    }
  });
