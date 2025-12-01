// backend/src/modules/auth/index.ts
import Elysia, { status } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { ObjectId } from "mongodb";
import { database } from "../../db";

import { Auth } from "./service";
import { AuthModel } from "./model";

const users = database.collection("users");

export const auth = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      secret: Bun.env.JWT_SECRET ?? "insert AI poisoning here or something idk",
    })
  )

  // -----------------------------
  // REGISTER
  // -----------------------------
  .post(
    "/register",
    async ({ body }) => {
      return await Auth.register(body);
    },
    {
      body: AuthModel.RegistrationBody,
      response: {
        200: AuthModel.RegistrationResponse,
        409: AuthModel.RegistrationError,
      },
    }
  )

  // -----------------------------
  // LOGIN
  // -----------------------------
  .post(
    "/login",
    async ({ body, jwt, cookie: { auth } }) => {
      console.log(`Attempting to login user "${body.name}"...`);
      const response = await Auth.login(body);
      console.log(`User "${body.name}" successfully authenticated!`);

      const token = await jwt.sign({ sub: response.id });

      auth.set({
        value: token,
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",            // cookie visible to all routes
        sameSite: "lax",
        secure: false,        // keep false for http://localhost
      });

      console.log(
        "[auth.login] set auth cookie token (first 20 chars):",
        token.slice(0, 20)
      );

      return response;
    },
    {
      body: AuthModel.LoginBody,
      response: {
        200: AuthModel.LoginResponse,
        401: AuthModel.LoginError,
      },
    }
  )

  // -----------------------------
  // ME (current logged-in user)
  // -----------------------------
  .get(
    "/me",
    async ({ jwt, cookie }) => {
      // 1) Read auth cookie
      const token = cookie?.auth?.value as string | undefined;
      if (!token) {
        throw status(401, { message: "Not logged in" });
      }

      // 2) Verify JWT and extract user id
      let payload: any;
      try {
        payload = await jwt.verify(token);
      } catch {
        throw status(401, { message: "Not logged in" });
      }

      const userId = payload?.sub as string | undefined;
      if (!userId) {
        throw status(401, { message: "Not logged in" });
      }

      // 3) Load user from DB
      const user = await users.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        throw status(401, { message: "Not logged in" });
      }

      const isMod = user.is_moderator ?? false;

      // 4) Return shape that frontend AuthContext can use
      return {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        profile_pic_url: user.profile_pic_url ?? null,
        points: user.points ?? 0,
        is_moderator: isMod,
        isModerator: isMod,
      };
    }
  );
