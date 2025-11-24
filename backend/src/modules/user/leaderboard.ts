import Elysia from "elysia";
import { User } from "./service";

export const leaderboard = new Elysia({ prefix: "/leaderboard" })
  .get("", async () => {
    return await User.getLeaderboard();
  });
