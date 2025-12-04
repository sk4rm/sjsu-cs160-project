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
        // 1) Approved + non-anonymous posts
        $match: {
          $and: [
            {
              $or: [
                { status: "approved" },
                { status: { $exists: false } },
              ],
            },
            { anonymous: { $ne: true } },
            { author_id: { $exists: true, $ne: null } },
          ],
        },
      },
  
      // 2) Count posts + likes per user
      {
        $group: {
          _id: "$author_id",
          likes: { $sum: { $ifNull: ["$likes", 0] } },
          posts: { $sum: 1 },
        },
      },
  
      // ⭐ NEW: sort will be moved AFTER user join (so we can sort by points)
      { $limit: limit },
  
      // 3) Join users
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDoc",
        },
      },
  
      // 4) Unwind
      {
        $unwind: {
          path: "$userDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
  
      // ⭐ NEW: Move the sort here so we have access to userDoc.points
      { $sort: { "userDoc.points": -1 } },
  
      // 5) Final projection
      {
        $project: {
          userId: "$_id",
          likes: 1,
          posts: 1,
  
          name: { $ifNull: ["$userDoc.name", "Anonymous"] },
          username: "$userDoc.username",
          profile_pic_url: "$userDoc.profile_pic_url",
  
          // ⭐ NEW FIELDS
          school: "$userDoc.school",
          points: "$userDoc.points",
        },
      },
    ];
  
    const results = await postsCollection.aggregate(pipeline).toArray();
  
    // Final map for frontend
    return results.map((u: any) => {
      const userId = u.userId?.toString() ?? "anonymous";
  
      const name = u.name ?? "Anonymous";
      const username = u.username;
  
      const handle =
        username && typeof username === "string"
          ? `@${username}`
          : "@" + name.toLowerCase().replace(/\s+/g, "");
  
      return {
        id: userId,
        name,
        handle,
        avatarUrl: u.profile_pic_url ?? null,
  
        posts: u.posts ?? 0,
        likes: u.likes ?? 0,
  
        // ⭐ Frontend can now use these:
        points: u.points ?? 0,
        school: u.school ?? null,
      };
    });
  }
}  