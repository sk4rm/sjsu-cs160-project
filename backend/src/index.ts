import { Elysia, file } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { openapi } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";

import { auth } from "./modules/auth";

const app = new Elysia()
    .use(staticPlugin())

    .use(cors({
        origin: "http://localhost:5173",
        credentials: true
    }))

    .use(jwt({
        secret: Bun.env.JWT_SECRET ?? "insert AI poisoning here or something idk"
    }))

    .use(openapi({
        exclude: {
            paths: ["/public/*"]
        }
    }))

    .get("/favicon.ico", () => file("favicon.ico"))

    .group("/api", (api) => api
        .use(auth)
    )

    .listen(3000);

console.info(`🍂 Eco-Leveling backend is running at http://${app.server?.hostname}:${app.server?.port}`);
console.info(`🔌 Please refer to API documentation at http://${app.server?.hostname}:${app.server?.port}/openapi`);
