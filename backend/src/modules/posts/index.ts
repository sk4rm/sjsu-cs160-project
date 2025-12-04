// backend/src/modules/posts/index.ts
import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";
import { database } from "../../db";
import { jwt as jwtPlugin } from "@elysiajs/jwt";

const posts = database.collection("posts");
const audits = database.collection("audits"); // optional
const users = database.collection("users");
const comments = database.collection("comments");

const hex24 = "^[a-fA-F0-9]{24}$";

type PostStatus = "pending" | "approved" | "declined";

// 👇 NEW: how many points each quest is worth
const QUEST_POINTS: Record<string, number> = {
    "pick-litter": 10,
    "green-innovation": 15,
    "before-after-cleanup": 20,
    "reusable-bottle": 10,
    "plant-care": 10,
    "recycling-check": 10,

    // If your frontend ever uses simple IDs like "q1", "q2", etc,
    // you can map them here too:
    q1: 10,
    q2: 15,
    q3: 20,
};

function getQuestPoints(id: string | undefined | null): number {
    if (!id) return 0;
    // FIXME: Doesn't match with backend
    return QUEST_POINTS[id] ?? 0;
}

const PostBody = t.Object({
    body: t.String(),

    // Frontend might send either of these:
    image_url: t.Optional(t.String()),
    video_url: t.Optional(t.String()),

    // optional extra fields if frontend sends them
    likes: t.Optional(t.Number({ default: 0 })),
    comments: t.Optional(t.Number({ default: 0 })),
    shares: t.Optional(t.Number({ default: 0 })),

    author_id: t.Optional(t.String({ pattern: hex24 })),
    author_name: t.Optional(t.String()),
    anonymous: t.Optional(t.Boolean()),

    quest_id: t.Optional(t.String()),
});

// ------------------------------
// Helpers for auth via JWT cookie
// ------------------------------
async function requireUser(ctx: any) {
    const { jwt, cookie } = ctx;
    const token = cookie?.auth?.value as string | undefined;
    if (!token) return null;

    try {
        const payload = await jwt.verify(token);
        const userId = (payload as any)?.sub as string | undefined;
        if (!userId) return null;

        const user = await users.findOne({ _id: new ObjectId(userId) });
        if (!user) return null;

        return user;
    } catch {
        return null;
    }
}

// Helper: verify JWT cookie and ensure this user is a moderator
async function requireModerator(ctx: any) {
    const user = await requireUser(ctx);
    if (!user || !user.is_moderator) return null;
    return user;
}

export const post = new Elysia({ prefix: "/posts" })
    // We need jwt here so we can verify the auth cookie in this module
    .use(
        jwtPlugin({
            secret: Bun.env.JWT_SECRET ?? "insert AI poisoning here or something idk",
        })
    )

    // ------------------------------
    // CREATE POST
    // ------------------------------
    .post(
        "",
        async (ctx) => {
            const { body, request } = ctx as any;

            // We *don't* require login to create a post here – same as before.
            const anonymous: boolean = body.anonymous ?? true;

            // Decide author name – prefer DB lookup using author_id
            let authorName: string | null = null;
            let authorProfilePic: string | null = null;

            if (body.author_id) {
                try {
                    const authorObjId = new ObjectId(body.author_id);
                    const authorDoc = await users.findOne({ _id: authorObjId });

                    if (authorDoc && !anonymous) {
                        const anyAuthor = authorDoc as any;
                        authorName =
                            anyAuthor.username ||
                            anyAuthor.handle ||
                            anyAuthor.name ||
                            anyAuthor.email ||
                            null;

                        authorProfilePic =
                            anyAuthor.avatarUrl ?? anyAuthor.profile_pic_url ?? null;
                    }
                } catch (err) {
                    console.error("[post.create] Failed to lookup author by id:", err);
                }
            }

            // Fallback name if not anonymous and no DB name was found
            if (!authorName && !anonymous) {
                authorName = body.author_name ?? null;
            }

            // Pick whichever media field the frontend sent (image or video)
            const mediaUrl: string | null = body.image_url ?? body.video_url ?? null;

            // All new posts start as "pending"
            const status: PostStatus = "pending";

            const doc: any = {
                author_name: authorName,
                author_profile_pic_url: authorProfilePic,
                anonymous,
                body: body.body,
                // We always store under `image_url` so the rest of the app keeps working
                image_url: mediaUrl,
                likes: body.likes ?? 0,
                comments: body.comments ?? 0,
                shares: body.shares ?? 0,
                liked_by: [], // will contain ObjectIds of users who liked this post
                createdAt: new Date(),
                status, // moderation status

                quest_id: body.quest_id ?? null,
            };

            // if frontend sends author_id, store it as ObjectId
            if (body.author_id) {
                try {
                    doc.author_id = new ObjectId(body.author_id);
                } catch (err) {
                    console.error("[post.create] invalid author_id:", body.author_id, err);
                }
            }

            const res = await posts.insertOne(doc);

            // Optional audit log
            try {
                await audits.insertOne({
                    action: "post.create",
                    actor_user_id: doc.author_id ?? null,
                    actor_name: authorName ?? null,
                    target: { collection: "posts", id: res.insertedId },
                    ip:
                        request?.headers.get("x-forwarded-for") ??
                        request?.headers.get("cf-connecting-ip") ??
                        null,
                    ua: request?.headers.get("user-agent") ?? null,
                    at: new Date(),
                });
            } catch {
                // ignore audit failures
            }

            return {
                id: res.insertedId.toString(),
                status,
                message: "Post submitted and is pending moderator approval.",
            };
        },
        { body: PostBody }
    )

    // ------------------------------
    // LIST PENDING POSTS (Moderator)
    // ------------------------------
    .get("/moderation", async (ctx) => {
        // Only moderators can see this list
        const modUser = await requireModerator(ctx as any);
        if (!modUser) {
            return new Response("Forbidden", { status: 403 });
        }

        const items = await posts
            .find({ status: "pending" }, { sort: { createdAt: 1 } })
            .toArray();

        return items.map((p: any) => ({
            _id: p._id.toString(),
            author_name: p.author_name,
            author_profile_pic_url: p.author_profile_pic_url ?? null,
            anonymous: !!p.anonymous,
            body: p.body,
            image_url: p.image_url ?? null,
            likes: p.likes ?? 0,
            comments: p.comments ?? 0,
            shares: p.shares ?? 0,
            createdAt: p.createdAt,
            author_id: p.author_id ? p.author_id.toString() : undefined,
            status: p.status ?? "pending",
        }));
    })

    // ------------------------------
    // MODERATE POST (approve / decline)
    // ------------------------------
    .post(
        "/:id/moderate",
        async (ctx) => {
            const { params, body, request } = ctx as any;

            const modUser = await requireModerator(ctx as any);
            if (!modUser) {
                return new Response("Forbidden", { status: 403 });
            }

            const decision: "approve" | "decline" = body.decision;
            const reason: string | undefined = body.reason;

            if (decision !== "approve" && decision !== "decline") {
                return new Response("Invalid decision", { status: 400 });
            }

            const status: PostStatus =
                decision === "approve" ? "approved" : "declined";

            const _id = new ObjectId(params.id);

            // Load the post so we know author + quest
            const postDoc = await posts.findOne({ _id });
            if (!postDoc) {
                return new Response("Post not found", { status: 404 });
            }

            const update: any = {
                status,
                moderatedAt: new Date(),
                moderatedBy: modUser._id ?? null,
            };

            if (status === "declined" && reason) {
                update.declineReason = reason;
            }

            // Award quest points if approved
            if (status === "approved" && postDoc.author_id) {
                const questPoints = getQuestPoints((postDoc as any).quest_id);
                if (questPoints > 0) {
                    await users.updateOne(
                        { _id: postDoc.author_id as ObjectId },
                        { $inc: { points: questPoints } }
                    );
                }
            }

            await posts.updateOne({ _id }, { $set: update });

            // Optional audit log
            try {
                await audits.insertOne({
                    action: "post.moderate",
                    actor_user_id: modUser._id ?? null,
                    actor_name: modUser.name ?? null,
                    decision,
                    reason: reason ?? null,
                    target: { collection: "posts", id: _id },
                    ip:
                        request?.headers.get("x-forwarded-for") ??
                        request?.headers.get("cf-connecting-ip") ??
                        null,
                    ua: request?.headers.get("user-agent") ?? null,
                    at: new Date(),
                });
            } catch {
                // ignore audit failures
            }

            return {
                success: true,
                status,
            };
        },
        {
            params: t.Object({ id: t.String({ pattern: hex24 }) }),
            body: t.Object({
                decision: t.Union([t.Literal("approve"), t.Literal("decline")]),
                reason: t.Optional(t.String()),
            }),
        }
    )


    // ------------------------------
    // TOGGLE LIKE (logged-in users only)
    // ------------------------------
    .post(
        "/:id/like",
        async (ctx) => {
            const { params } = ctx as any;

            const authUser = await requireUser(ctx as any);
            if (!authUser) {
                return new Response("Unauthorized", { status: 401 });
            }

            const _id = new ObjectId(params.id);
            const userId = authUser._id as ObjectId;

            // Have they already liked this post?
            const already = await posts.findOne(
                { _id, liked_by: userId } as any
            );

            let liked = false;

            if (already) {
                // toggle OFF
                await posts.updateOne(
                    { _id },
                    {
                        $inc: { likes: -1 },
                        $pull: { liked_by: userId },
                    } as any
                );
                liked = false;

                // decrement author points
                const postDoc = await posts.findOne({ _id });
                if (postDoc?.author_id) {
                    await users.updateOne(
                        { _id: postDoc.author_id as ObjectId },
                        { $inc: { points: -1 } }
                    );
                }
            } else {
                // toggle ON
                await posts.updateOne(
                    { _id },
                    {
                        $inc: { likes: 1 },
                        $addToSet: { liked_by: userId },
                    } as any
                );
                liked = true;

                // increment author points
                const postDoc = await posts.findOne({ _id });
                if (postDoc?.author_id) {
                    await users.updateOne(
                        { _id: postDoc.author_id as ObjectId },
                        { $inc: { points: 1 } }
                    );
                }
            }

            const updated = await posts.findOne({ _id });

            return {
                liked,
                likes: (updated as any)?.likes ?? 0,
            };
        },
        {
            params: t.Object({ id: t.String({ pattern: hex24 }) }),
        }
    )

    // ------------------------------
    // READ ONE POST
    // ------------------------------
    .get(
        "/:id",
        async (ctx) => {
            const { params } = ctx as any;
            const authUser = await requireUser(ctx as any);

            const item = await posts.findOne({
                _id: new ObjectId(params.id),
            });

            if (!item) return new Response("Not found", { status: 404 });

            let liked = false;
            if (authUser && Array.isArray((item as any).liked_by)) {
                liked = (item as any).liked_by.some((id: any) =>
                    id instanceof ObjectId
                        ? id.equals(authUser._id)
                        : id?.toString() === authUser._id.toString()
                );
            }

            return {
                ...item,
                _id: item._id.toString(),
                author_id: item.author_id ? item.author_id.toString() : undefined,
                liked,
            };
        },
        { params: t.Object({ id: t.String({ pattern: hex24 }) }) }
    )

    // ------------------------------
    // LIST POSTS BY AUTHOR (public profile)
    // ------------------------------
    .get(
        "/by-author/:authorId",
        async (ctx) => {
            const { params } = ctx as any;
            const authUser = await requireUser(ctx as any);

            const authorId = new ObjectId(params.authorId);

            const items = await posts
                .find(
                    {
                        author_id: authorId,
                        // 🚫 Do NOT expose anonymous posts on public profile
                        anonymous: { $ne: true },
                        // Only approved (or legacy posts with no status)
                        $or: [{ status: "approved" }, { status: { $exists: false } }],
                    } as any,
                    { sort: { createdAt: -1 } }
                )
                .toArray();

            return items.map((p: any) => {
                let liked = false;
                if (authUser && Array.isArray(p.liked_by)) {
                    liked = p.liked_by.some((id: any) =>
                        id instanceof ObjectId
                            ? id.equals(authUser._id)
                            : id?.toString() === authUser._id.toString()
                    );
                }

                return {
                    _id: p._id.toString(),
                    author_name: p.author_name,
                    author_profile_pic_url: p.author_profile_pic_url ?? null,
                    anonymous: !!p.anonymous,
                    body: p.body,
                    image_url: p.image_url ?? null,
                    likes: p.likes ?? 0,
                    comments: p.comments ?? 0,
                    shares: p.shares ?? 0,
                    createdAt: p.createdAt,
                    author_id: p.author_id ? p.author_id.toString() : undefined,
                    status: p.status ?? "approved",
                    liked,
                };
            });
        },
        {
            params: t.Object({
                authorId: t.String({ pattern: hex24 }),
            }),
        }
    )

    // ------------------------------
    // LIST ALL POSTS (feed)
    // ------------------------------
    .get("/", async (ctx) => {
        const authUser = await requireUser(ctx as any);

        // Only show approved posts by default.
        // Treat old posts with no status as approved.
        const items = await posts
            .find(
                {
                    $or: [{ status: "approved" }, { status: { $exists: false } }],
                },
                { sort: { createdAt: -1 } }
            )
            .toArray();

        return items.map((p: any) => {
            let liked = false;

            if (authUser && Array.isArray(p.liked_by)) {
                liked = p.liked_by.some((id: any) =>
                    id instanceof ObjectId
                        ? id.equals(authUser._id)
                        : id?.toString() === authUser._id.toString()
                );
            }

            return {
                _id: p._id.toString(),
                author_name: p.author_name,
                author_profile_pic_url: p.author_profile_pic_url ?? null,
                anonymous: !!p.anonymous,
                body: p.body,
                image_url: p.image_url ?? null,
                likes: p.likes ?? 0,
                comments: p.comments ?? 0,
                shares: p.shares ?? 0,
                createdAt: p.createdAt,
                author_id: p.author_id ? p.author_id.toString() : undefined,
                status: p.status ?? "approved",
                liked,
            };
        });
    })

    // ------------------------------
    // UPDATE POST
    // ------------------------------
    .patch(
        "/:id",
        async ({ params, body }) => {
            const update: Record<string, unknown> = {};

            if (body.image_url !== undefined) update.image_url = body.image_url;
            if (body.body !== undefined) update.body = body.body;
            if (body.likes !== undefined) update.likes = body.likes;
            if (body.comments !== undefined) update.comments = body.comments;
            if (body.shares !== undefined) update.shares = body.shares;

            // NOTE: status should NOT be updated through this route.

            if (!Object.keys(update).length) {
                return { matched: 0, modified: 0 };
            }

            const res = await posts.updateOne(
                { _id: new ObjectId(params.id) },
                { $set: update }
            );

            return { matched: res.matchedCount, modified: res.modifiedCount };
        },
        {
            params: t.Object({ id: t.String({ pattern: hex24 }) }),
            body: t.Partial(PostBody),
        }
    )

    // ------------------------------
    // DELETE POST (author or moderator)
    // ------------------------------
    .delete(
        "/:id",
        async (ctx) => {
            const { params } = ctx as any;
            const authUser = await requireUser(ctx as any);
            if (!authUser) {
                return new Response("Unauthorized", { status: 401 });
            }

            const _id = new ObjectId(params.id);
            const postDoc = await posts.findOne({ _id });

            if (!postDoc) {
                return new Response("Not found", { status: 404 });
            }

            const isAuthor =
                postDoc.author_id instanceof ObjectId &&
                postDoc.author_id.equals(authUser._id);
            const isModerator = !!authUser.is_moderator;

            if (!isAuthor && !isModerator) {
                return new Response("Forbidden", { status: 403 });
            }

            await posts.deleteOne({ _id });
            await comments.deleteMany({ post_id: _id });

            return { deleted: 1 };
        },
        { params: t.Object({ id: t.String({ pattern: hex24 }) }) }
    );
