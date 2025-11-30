import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Toggle like on a generation
export const toggle = mutation({
  args: {
    userId: v.string(),
    generationId: v.id("generations"),
  },
  handler: async (ctx, args) => {
    // Check if generation exists
    const generation = await ctx.db.get(args.generationId);
    if (!generation) throw new Error("Generation not found");

    // Check if user already liked this generation
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_userId_generationId", (q) =>
        q.eq("userId", args.userId).eq("generationId", args.generationId)
      )
      .first();

    if (existingLike) {
      // Unlike: remove the like and decrement count
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.generationId, {
        likesCount: Math.max(0, generation.likesCount - 1),
      });
      return { liked: false, likesCount: Math.max(0, generation.likesCount - 1) };
    } else {
      // Like: add the like and increment count
      await ctx.db.insert("likes", {
        userId: args.userId,
        generationId: args.generationId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.generationId, {
        likesCount: generation.likesCount + 1,
      });
      return { liked: true, likesCount: generation.likesCount + 1 };
    }
  },
});

// Check if user has liked a generation
export const hasLiked = query({
  args: {
    userId: v.string(),
    generationId: v.id("generations"),
  },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("likes")
      .withIndex("by_userId_generationId", (q) =>
        q.eq("userId", args.userId).eq("generationId", args.generationId)
      )
      .first();

    return !!like;
  },
});

// Get all liked generation IDs for a user (for batch checking in gallery)
export const getUserLikedIds = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return likes.map((like) => like.generationId);
  },
});

// Get user's liked generations with full data
export const getUserLikedGenerations = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Fetch full generation data for each like
    const generations = await Promise.all(
      likes.map(async (like) => {
        const generation = await ctx.db.get(like.generationId);
        if (!generation) return null;

        let outputUrl = null;
        let thumbnailUrl = null;

        if (generation.outputStorageId) {
          outputUrl = await ctx.storage.getUrl(generation.outputStorageId);
        }
        if (generation.thumbnailStorageId) {
          thumbnailUrl = await ctx.storage.getUrl(generation.thumbnailStorageId);
        }

        return {
          ...generation,
          outputUrl,
          thumbnailUrl,
          likedAt: like.createdAt,
        };
      })
    );

    // Filter out null values (deleted generations)
    return generations.filter(Boolean);
  },
});
