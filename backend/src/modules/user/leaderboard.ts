import Elysia, { t } from "elysia";
import { User } from "./service";

export const leaderboard = new Elysia({ prefix: "/leaderboard" })
  .get(
    "",
    async ({ query }) => {
      const limit = query?.limit ? Number(query.limit) : 50;
      const rows = await User.getLeaderboard(limit);

      // ⭐ Hide the synthetic "Anonymous" user from the leaderboard
      return rows.filter((row: any) => {
        const name = row.name ?? row.displayName ?? "";
        const handle = (row.handle ?? row.username ?? "").toLowerCase();

        return (
          name !== "Anonymous" &&
          handle !== "anonymous" &&
          handle !== "@anonymous"
        );
      });
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
    }
  );
