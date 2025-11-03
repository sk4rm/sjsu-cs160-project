import Elysia, { t } from "elysia";
import { Auth } from "./service";
import { AuthModel } from "./model";

import { database } from "../../db";

export const auth = new Elysia({ prefix: "/auth" })
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
        })

    .post(
        "/login",
        async ({ body, set }) => {
            const user = await database.collection("users").findOne({ name: body.name });
            if (!user || !Bun.password.verifySync(body.password, user.password)) {
                set.status = 401;
                return { error: "Invalid credentials" };
            }
            return { id: user._id.toString(), name: user.name, profile_pic_url: user.profile_pic_url };
        },
        {
            body: t.Object({
                name: t.String(), password: t.String()
            })
        });