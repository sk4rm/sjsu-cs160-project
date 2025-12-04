// backend/src/modules/profile/index.ts
import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../../db";

const usersCollection = database.collection("users");
const postsCollection = database.collection("posts");
const commentsCollection = database.collection("comments"); // comments for name-cascade

// NOTE: For these profile routes, we rely on userId
// sent from the frontend instead of cookies/session.
// This avoids any mismatch with ctx.user.
export const profile = new Elysia({ prefix: "/users" })

  // ------------------------------------
  // GET /users/me – return current user
  // ------------------------------------
  .get(
    "/me",
    async (ctx) => {
      const { set, query } = ctx as any;
      const userId = query?.userId as string | undefined;

      if (!userId || !ObjectId.isValid(userId)) {
        set.status = 400;
        return { message: "userId query param required" };
      }

      const user = await usersCollection.findOne({
        _id: new ObjectId(userId),
      });
      
      if (!user) {
          set.status = 404;
          return { message: "User not found" };
        }
        
      const idStr = user._id.toString();
      const name: string = user.name ?? "";
      const username: string | null = user.username ?? null;
      const school: string = user.school ?? "";
      const bio: string = user.bio ?? "";
      const avatarUrl: string | null = user.profile_pic_url ?? null;
      const joinedAt: string | undefined =
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : undefined;

      return {
        id: idStr,
        _id: idStr,
        name,
        username,
        handle: username ? `@${username}` : undefined,
        school,
        bio,
        avatarUrl,
        joinedAt,
        points: user.points ?? undefined
      };
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // -----------------------------------------
  // PATCH /users/me – edit profile information
  // -----------------------------------------
  .patch(
    "/me",
    async (ctx) => {
      const { set, body } = ctx as any;

      const payload = body as {
        userId?: string;
        name?: string;
        username?: string;
        school?: string;
        bio?: string;
        avatarUrl?: string;
        profile_pic_url?: string;
      };

      if (!payload.userId || !ObjectId.isValid(payload.userId)) {
        set.status = 400;
        return { message: "userId is required" };
      }

      const userObjectId = new ObjectId(payload.userId);

      const existingUser = await usersCollection.findOne({
        _id: userObjectId,
      });

      if (!existingUser) {
        set.status = 404;
        return { message: "User not found" };
      }

      const updates: Record<string, unknown> = {};

      // Name (display name)
      if (typeof payload.name === "string") {
        const trimmed = payload.name.trim();
        if (trimmed.length > 0) updates.name = trimmed;
      }

      // Username (handle without "@") – enforce uniqueness
      if (typeof payload.username === "string") {
        const trimmed = payload.username.trim();

        if (trimmed) {
          const usernameTaken = await usersCollection.findOne({
            username: trimmed,
            _id: { $ne: userObjectId },
          });

          if (usernameTaken) {
            set.status = 409;
            return { message: "That username is already taken." };
          }

          updates.username = trimmed;
        } else {
          updates.username = null;
        }
      }

      // School
      if (typeof payload.school === "string") {
        updates.school = payload.school.trim();
      }

      // Bio
      if (typeof payload.bio === "string") {
        updates.bio = payload.bio;
      }

      // Avatar URL or data URL (string)
      if (
        payload.avatarUrl !== undefined ||
        payload.profile_pic_url !== undefined
      ) {
        updates.profile_pic_url =
          payload.avatarUrl ?? payload.profile_pic_url ?? null;
      }

      if (Object.keys(updates).length === 0) {
        return { message: "No changes" };
      }

      // 1) Update the user document
      await usersCollection.updateOne(
        { _id: userObjectId },
        { $set: updates }
      );

      // 2) Load the updated user
      const updated = await usersCollection.findOne({ _id: userObjectId });
      if (!updated) {
        set.status = 500;
        return { message: "Failed to load updated user" };
      }

      const updatedUsername = (updated as any).username ?? null;

      // 3) If the display name changed, cascade to posts + comments
      if (updates.name) {
        const newName = (updated as any).name ?? "";

        // Update all posts authored by this user
        await postsCollection.updateMany(
          { author_id: userObjectId },
          { $set: { author_name: newName } }
        );

        // Update all comments authored by this user
        await commentsCollection.updateMany(
          { author_id: userObjectId },
          { $set: { author_name: newName } }
        );
      }

      // 4) Return the updated user shape the frontend expects
      return {
        id: updated._id.toString(),
        _id: updated._id.toString(),
        name: updated.name ?? "",
        username: updatedUsername,
        handle: updatedUsername ? `@${updatedUsername}` : undefined,
        school: (updated as any).school ?? "",
        bio: (updated as any).bio ?? "",
        avatarUrl: (updated as any).profile_pic_url ?? null,
        joinedAt:
          (updated as any).createdAt instanceof Date
            ? (updated as any).createdAt.toISOString()
            : undefined,
        stats: (updated as any).stats ?? undefined,
      };
    },
    {
      body: t.Object({
        userId: t.String(),
        name: t.Optional(t.String()),
        username: t.Optional(
          t.String({
            minLength: 3,
            maxLength: 20,
            pattern: "^[a-zA-Z0-9_]+$",
          })
        ),
        school: t.Optional(t.String()),
        bio: t.Optional(t.String()),
        avatarUrl: t.Optional(t.String()),
        profile_pic_url: t.Optional(t.String()),
      }),
    }
  )

    // -----------------------------------
  // GET /users/me/posts – posts by user
  // -----------------------------------
  .get(
    "/me/posts",
    async (ctx) => {
      const { set, query } = ctx as any;
      const userId = query?.userId as string | undefined;

      if (!userId || !ObjectId.isValid(userId)) {
        set.status = 400;
        return { message: "userId query param required" };
      }

      const userObjectId = new ObjectId(userId);

      // ✅ Strict: only posts where author_id is this user
      // ✅ Only approved (or legacy with no status)
      const filter = {
        author_id: userObjectId,
        $or: [{ status: "approved" }, { status: { $exists: false } }],
      } as any;

      const docs = await postsCollection
        .find(filter)
        .project({ image_url: 1, body: 1 })
        .sort({ createdAt: -1 })
        .toArray();

      return docs
        .filter((p: any) => p.image_url)
        .map((p: any) => {
          const url = p.image_url as string;

          let mediaType: "image" | "video" = "image";
          if (typeof url === "string" && url.startsWith("data:video/")) {
            mediaType = "video";
          }

          return {
            id: p._id.toString(),
            mediaUrl: url,
            mediaType,
            alt: (p.body as string | undefined) ?? "",
          };
        });
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
    }
  );

