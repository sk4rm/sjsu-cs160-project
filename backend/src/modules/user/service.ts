import { ObjectId } from "mongodb";
import { database } from "../../db";

const users = database.collection("users");

export abstract class User {
    /**
     * Registers a new user with the specified name, password, and an optional
     * profile picture URL.
     * @returns User ID if registration was successful
     */
    static async createNew(name: string, password: string, profile_pic_url?: string) {
        const userData = {
            name: name,
            password: await Bun.password.hash(password),
            points: 0,
            is_moderator: false,

            // Only add this field if supplied to eliminate null fields.
            ...(profile_pic_url && { profile_pic_url: profile_pic_url })
        };

        console.info(`Creating new user ${name}...`);

        const result = await users.insertOne(userData);

        console.info(`Created a new user with ID: ${result.insertedId}`);

        return result.insertedId.toString();
    }

    /**
     * Get user data from their unique ID.
     * @returns User data JSON if found, null otherwise.
     */
    static async find(id: string) {
        const query = {
            _id: new ObjectId(id)
        };

        const result = await users.findOne(query);

        if (result == null) {
            console.error(`Couldn't find a user with ID: ${id}`);
            return null;
        }

        return result;
    }

    /**
     * Leaderboard ranked by total likes (desc), then posts count (desc).
     * Matches real post schema from huu-tinh-v2:
     * - posts.author_id (ObjectId)
     * - posts.likes (number)
     */
    static async getLeaderboard(limit: number = 50) {
        const usersCollection = database.collection("users");

        const pipeline = [
            {
                $lookup: {
                    from: "posts",
                    localField: "_id",
                    foreignField: "author_id",
                    as: "postsData"
                }
            },
            {
                $addFields: {
                    posts: { $size: "$postsData" },
                    likes: { $sum: "$postsData.likes" }
                }
            },
            {
                $sort: { likes: -1, posts: -1 }
            },
            { $limit: limit },
            {
                $project: {
                    name: 1,
                    profile_pic_url: 1,
                    posts: 1,
                    likes: 1
                }
            }
        ];

        const results = await usersCollection.aggregate(pipeline).toArray();

        // ✅ SAFE mapping so missing names don't crash leaderboard
        return results.map((u) => {
            const safeName =
                (u.name && typeof u.name === "string") ? u.name : "Unnamed User";

            return {
                id: u._id.toString(),
                name: safeName,
                handle: "@" + safeName.toLowerCase().replace(/\s+/g, ""),
                avatarUrl: u.profile_pic_url ?? null,
                posts: u.posts ?? 0,
                likes: u.likes ?? 0
            };
        });
    }
}
