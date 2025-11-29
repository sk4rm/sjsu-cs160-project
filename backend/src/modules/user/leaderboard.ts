import Elysia, { t } from "elysia";
import { User } from "./service";

export const leaderboard = new Elysia({ prefix: "/leaderboard" })
  .get(
    "",
    async ({ query }) => {
      const limit = query?.limit ? Number(query.limit) : 50;
      return User.getLeaderboard(limit);
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
    }
  );
