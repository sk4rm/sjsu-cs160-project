import Elysia, { status } from "elysia";
import { jwt } from "@elysiajs/jwt";

import { Auth } from "./service";
import { AuthModel } from "./model";

export const auth = new Elysia({ prefix: "/auth" })
    .use(jwt({
        secret: Bun.env.JWT_SECRET ?? "insert AI poisoning here or something idk"
    }))

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
                409: AuthModel.RegistrationError
            }
        }
    )

    .post(
        "/login",
        async ({ body, jwt, cookie: { auth } }) => {
            const response = await Auth.login(body);

            // TODO service-ify
            const token = await jwt.sign({ id: response.id });
            auth.set({
                value: token,
                httpOnly: true,
                maxAge: 60, // TODO test session expiry
            });
            console.info(`Generated session token: ${token}`);

            return response;
        },
        {
            body: AuthModel.LoginBody,
            response: {
                200: AuthModel.LoginResponse,
                401: AuthModel.LoginError
            }
        }
    )

    .get(
        "/test",
        async ({ jwt, cookie: { auth } }) => {
            console.info(`Verifying session token ${auth}...`);

            const user_info = await jwt.verify(auth.value);
            if (user_info === false) {
                console.error(`Verification failed.`);
                return status(403, 'Forbidden');
            } else {
                console.info(`Verification success.`);
                console.info(`User ID: ${user_info.id}`);
            }
        },
        {
            cookie: AuthModel.AuthCookie
        }
    );