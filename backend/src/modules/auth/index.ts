import Elysia from "elysia";
import { Auth } from "./service";
import { AuthModel } from "./model";

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
        async ({ body }) => {
            const response = await Auth.login(body);
            return response;
        },
        {
            body: AuthModel.LoginBody,
            response: {
                200: AuthModel.LoginResponse,
                401: AuthModel.LoginError
            }
        });