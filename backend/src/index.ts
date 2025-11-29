import { Elysia, file } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { openapi } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";

import { auth } from "./modules/auth";
import { user } from "./modules/user";
import { leaderboard } from "./modules/user/leaderboard"; // public
import { post } from "./modules/posts";
import { commentsModule } from "./modules/comment";
import { currentUser } from "./plugins/currentUser";

const app = new Elysia()
  .use(currentUser)
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

// --------------------
// ✅ PUBLIC ROUTES
// --------------------
app.group("/api", (api) => api.use(leaderboard)); // /api/leaderboard

// --------------------
// 🔒 PROTECTED + OPTIONAL-USER ROUTES
// --------------------
app.group("/api", (api) =>
  api
    .use(auth)           // /api/auth/*
    .use(user)           // /api/users/*
    .use(post)           // /api/posts/*
    .use(commentsModule) // /api/comments/*
);

app.listen(3000);

console.info(
  `🍂 Eco-Leveling backend is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.info(
  `🔌 API docs at http://${app.server?.hostname}:${app.server?.port}/openapi`
);
