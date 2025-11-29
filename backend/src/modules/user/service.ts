import { ObjectId } from "mongodb";
import { database } from "../../db";

const users = database.collection("users");

export abstract class User {
  static async createNew(name: string, password: string, profile_pic_url?: string) {
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
   * ✅ Leaderboard ranked by total likes from posts,
   * then by number of posts. Posts use author_name now.
   */
  static async getLeaderboard(limit: number = 50) {
    const postsCollection = database.collection("posts");

    const pipeline = [
      {
        $group: {
          _id: "$author_name",            // can be null (anonymous)
          likes: { $sum: "$likes" },
          posts: { $sum: 1 }
        }
      },
      { $sort: { likes: -1, posts: -1 } },
      { $limit: limit },

      // try matching to a user document by name
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "name",
          as: "userDoc"
        }
      },
      { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          name: "$_id",
          likes: 1,
          posts: 1,
          profile_pic_url: "$userDoc.profile_pic_url",
          userId: "$userDoc._id"
        }
      }
    ];

    const results = await postsCollection.aggregate(pipeline).toArray();

    return results.map((u) => {
      const name = u.name ?? "Anonymous";
      return {
        id: u.userId ? u.userId.toString() : `anon-${name}`,
        name,
        handle: "@" + name.toLowerCase().replace(/\s+/g, ""),
        avatarUrl: u.profile_pic_url ?? null,
        posts: u.posts ?? 0,
        likes: u.likes ?? 0
      };
    });
  }
}
