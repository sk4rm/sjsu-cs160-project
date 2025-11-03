import { t } from "elysia";

export namespace AuthModel {
    export const RegistrationBody = t.Object({
        name: t.String({ minLength: 3 }),
        password: t.String({ minLength: 3 }),
        profile_pic_url: t.Optional(t.String())
    });

    export const RegistrationError = t.Object({
        message: t.String()
    });

    export const RegistrationResponse = t.Object({
        id: t.String()
    });

    export const LoginBody = t.Object({
        name: t.String(),
        password: t.String()
    });

    export const LoginResponse = t.Object({
        id: t.String(),
        name: t.String(),
        profile_pic_url: t.Optional(t.String())
    });

    export const LoginError = t.Object({
        message: t.String()
    });

    export type RegistrationBody = typeof RegistrationBody.static;
    export type RegistrationError = typeof RegistrationError.static;
    export type RegistrationResponse = typeof RegistrationResponse.static;
    export type LoginBody = typeof LoginBody.static;
    export type LoginResponse = typeof LoginResponse.static;
    export type LoginError = typeof LoginError.static;
}