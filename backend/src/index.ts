import { Elysia, file } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { openapi } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";

import { auth } from "./modules/auth";
import { user } from "./modules/user";
import { leaderboard } from "./modules/user/leaderboard"; // ✅ Public leaderboard

const app = new Elysia()
    .use(staticPlugin())

    .use(
        cors({
            origin: "http://localhost:5173",
            credentials: true,
        })
    )

    .use(
        openapi({
            exclude: {
                paths: ["/public/*"],
            },
        })
    )

    .get("/favicon.ico", () => file("favicon.ico"));

// ------------------------------------------------------
// ✅ PUBLIC API ROUTES — Do NOT require JWT / auth
// ------------------------------------------------------
app.group("/api", (api) =>
    api.use(leaderboard) // /api/leaderboard
);

// ------------------------------------------------------
// 🔒 PROTECTED API ROUTES — Require JWT / auth
// ------------------------------------------------------
app.group("/api", (api) =>
    api.use(auth).use(user)
);

app.listen(3000);

console.info(
    `🍂 Eco-Leveling backend is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.info(
    `🔌 Please refer to API documentation at http://${app.server?.hostname}:${app.server?.port}/openapi`
);
