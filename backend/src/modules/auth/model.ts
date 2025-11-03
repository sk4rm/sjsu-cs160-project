import { t } from "elysia";

export namespace AuthModel {
    export const RegistrationBody = t.Object({
        name: t.String({ minLength: 3 }),
        password: t.String({ minLength: 3 }),
        profile_pic_url: t.Optional(t.String())
    });
    export type RegistrationBody = typeof RegistrationBody.static;

    export const RegistrationError = t.Object({
        message: t.String()
    });
    export type RegistrationError = typeof RegistrationError.static;

    export const RegistrationResponse = t.Object({
        id: t.String()
    });
    export type RegistrationResponse = typeof RegistrationResponse.static;
}