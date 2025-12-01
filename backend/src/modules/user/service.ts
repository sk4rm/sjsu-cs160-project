import { ObjectId } from "mongodb";
import { database } from "../../db";

const users = database.collection("users");

export abstract class User {
  static async createNew(
    name: string,
    password: string,
    profile_pic_url?: string
  ) {
    const userData = {
      name,
      password: await Bun.password.hash(password),
      points: 0,
      is_moderator: false,
      ...(profile_pic_url && { profile_pic_url }),
    };

    const result = await users.insertOne(userData);
    return result.insertedId.toString();
  }

  static async find(id: string) {
    return users.findOne({ _id: new ObjectId(id) });
  }

  /**
   * ✅ Leaderboard
   * - Only counts NON-ANONYMOUS posts
   * - Only counts APPROVED posts (or legacy posts with no status)
   * - Groups by author_id (real user), then joins to users collection
   */
  static async getLeaderboard(limit: number = 50) {
    const postsCollection = database.collection("posts");

    const pipeline = [
      {
        // 1) Only approved posts (or legacy posts with no status)
        //    and only posts that belong to a real, non-anonymous user.
        $match: {
          $and: [
            {
              $or: [
                { status: "approved" },
                { status: { $exists: false } }, // old posts before moderation
              ],
            },
            { anonymous: { $ne: true } }, // ignore anonymous posts
            { author_id: { $exists: true, $ne: null } },
          ],
        },
      },
      {
        // 2) Group by author_id and accumulate likes + post count
        $group: {
          _id: "$author_id",
          likes: { $sum: { $ifNull: ["$likes", 0] } },
          posts: { $sum: 1 },
        },
      },
      {
        // 3) Sort by likes, then by # of posts
        $sort: { likes: -1, posts: -1 },
      },
      {
        // 4) Limit the number of rows
        $limit: limit,
      },
      {
        // 5) Join with users collection by _id = author_id
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      {
        // 6) Unwind but allow rows even if userDoc is missing
        $unwind: {
          path: "$userDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // 7) Final projection
        $project: {
          userId: "$_id",
          likes: 1,
          posts: 1,
          name: {
            $ifNull: ["$userDoc.name", "Anonymous"],
          },
          username: "$userDoc.username",
          profile_pic_url: "$userDoc.profile_pic_url",
        },
      },
    ];

    const results = await postsCollection.aggregate(pipeline).toArray();

    // 8) Map to the shape expected by the frontend
    return results.map((u: any) => {
      const userId: ObjectId | null = u.userId ?? null;
      const name: string = u.name ?? "Anonymous";
      const username: string | null = u.username ?? null;

      const handle =
        username && typeof username === "string"
          ? `@${username}`
          : "@" + name.toLowerCase().replace(/\s+/g, "");

      return {
        id: userId ? userId.toString() : `anon-${name}`,
        name,
        handle,
        avatarUrl: u.profile_pic_url ?? null,
        posts: u.posts ?? 0,
        likes: u.likes ?? 0,
      };
    });
  }
}
