import { t } from "elysia";

export namespace UserModel {
    export const registrationBody = t.Object({
        name: t.String(),
        password: t.String(),
        profile_pic_url: t.Optional(t.String()),
    });

    export const id = t.Object({
        id: t.String()
    });

    export const patchBody = t.Object({
        name: t.Optional(t.String()),
        bio: t.Optional(t.String()),
        password: t.Optional(t.String()),
        points: t.Optional(t.Integer()),
        profile_pic_url: t.Optional(t.String()),
        is_moderator: t.Optional(t.Boolean())
    });
}