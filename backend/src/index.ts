import { Elysia, file } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { openapi } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";

import { auth } from "./modules/auth";
import { user } from "./modules/user";
import { leaderboard } from "./modules/user/leaderboard";
import { post } from "./modules/posts";
import { commentsModule } from "./modules/comment";
import { currentUser } from "./plugins/currentUser";
import { profile } from "./modules/profile";
import { quests } from "./modules/quests"; // 👈 NEW

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
      exclude: { paths: ["/public/*"] },
    })
  )
  .get("/favicon.ico", () => file("favicon.ico"));

app.group("/api", (api) =>
  api
    .use(currentUser)
    .use(leaderboard)
    .use(auth)
    .use(user)
    .use(profile)
    .use(post)
    .use(commentsModule)
    .use(quests) // 👈 NEW: /api/quests/today
);

app.listen(3000);

console.info(
  `🍂 Eco-Leveling backend is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.info(
  `🔌 API docs at http://${app.server?.hostname}:${app.server?.port}/openapi`
);
