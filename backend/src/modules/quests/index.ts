// backend/src/modules/quests/index.ts
import { Elysia } from "elysia";

type Quest = {
  id: string;
  title: string;
  description: string;
  points: number;
};

/**
 * Pool of all possible quests.
 * The server will choose 3 of these each day, based on the date.
 */
export const QUEST_POOL: Quest[] = [
  {
    id: "pick-litter",
    title: "Pick up 5 pieces of litter",
    description:
      "Upload a photo of trash you removed from campus or your neighborhood.",
      points: 10
  },
  {
    id: "reusable-bottle",
    title: "Bring a reusable bottle",
    description:
      "Show your reusable water bottle or mug instead of a single-use plastic bottle.",
      points: 5
  },
  {
    id: "green-innovation",
    title: "Spot a green innovation",
    description:
      "Share a picture of an eco-friendly feature (solar panels, refill station, bike racks, etc.).",
      points: 5
  },
  {
    id: "before-after-cleanup",
    title: "Before & after cleanup",
    description:
      "Take a before and after photo of an area you cleaned or organized.",
      points: 50
  },
  {
    id: "plant-care",
    title: "Care for a plant",
    description:
      "Show yourself watering, repotting, or tending to a plant or garden.",
      points: 10
  },
  {
    id: "recycling-check",
    title: "Check recycling labels",
    description:
      "Take a photo of you correctly sorting items into recycling / compost / trash.",
      points: 20
  }
  // add more quests here whenever you want!
];

function getTodayQuests(): Quest[] {
  if (QUEST_POOL.length === 0) return [];

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const dayIndex = Math.floor(Date.now() / MS_PER_DAY); // 0,1,2,... increases every day

  const result: Quest[] = [];
  const count = Math.min(3, QUEST_POOL.length);

  for (let i = 0; i < count; i++) {
    const idx = (dayIndex + i) % QUEST_POOL.length;
    result.push(QUEST_POOL[idx]);
  }

  return result;
}

// exported module for index.ts to .use(...)
export const quests = (app: Elysia) =>
  app.group("/quests", (api) =>
    api.get("/today", () => {
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

      return {
        date: today,
        quests: getTodayQuests()
      };
    })
  );
