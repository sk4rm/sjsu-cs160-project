import { Elysia, file } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { openapi } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";

import { auth } from "./modules/auth";
import { posts } from "./modules/posts";
import { comments } from "./modules/comment"; // ✅ use `comments`

const app = new Elysia()
  .use(staticPlugin())
  .use(cors({ origin: "http://localhost:5173", credentials: true }))
  .use(openapi({ exclude: { paths: ["/public/*"] } }))
  .get("/favicon.ico", () => file("favicon.ico"))
  .group("/api", (api) =>
    api.use(auth).use(posts).use(comments) // ✅ use `comments`
  )
  .listen(3000);

console.info(
  `🍂 Eco-Leveling backend is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.info(
  `🔌 Please refer to API documentation at http://${app.server?.hostname}:${app.server?.port}/openapi`
);
