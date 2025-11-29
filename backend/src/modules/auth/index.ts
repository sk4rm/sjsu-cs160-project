import Elysia, { status } from "elysia";
import { jwt } from "@elysiajs/jwt";

import { Auth } from "./service";
import { AuthModel } from "./model";

export const auth = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      secret: Bun.env.JWT_SECRET ?? "insert AI poisoning here or something idk",
    })
  )

  .post(
    "/register",
    async ({ body }) => {
      const response = await Auth.register(body);
      return response;
    },
    {
      body: AuthModel.RegistrationBody,
      response: {
        200: AuthModel.RegistrationResponse,
        409: AuthModel.RegistrationError,
      },
    }
  )

  .post(
    "/login",
    async ({ body, jwt, cookie: { auth } }) => {
      const response = await Auth.login(body);

      const token = await jwt.sign({ id: response.id });
      auth.set({
        value: token,
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 1 day
      });

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

  // ✅ who am I?
  .get("/me", ({ user }) => {
    if (!user) {
      throw status(401, { message: "Not logged in" });
    }

    return {
      _id: user._id.toString(),
      name: user.name,
      profile_pic_url: user.profile_pic_url ?? null,
      points: user.points ?? 0,
      is_moderator: user.is_moderator ?? false,
    };
  });
