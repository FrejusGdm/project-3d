import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get a single generation by ID
export const get = query({
  args: { id: v.id("generations") },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.id);
    if (!generation) return null;

    // Get file URLs if they exist
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
    };
  },
});

// Get all generations for a batch (4 variations)
export const getByBatchId = query({
  args: { batchId: v.string() },
  handler: async (ctx, args) => {
    const generations = await ctx.db
      .query("generations")
      .withIndex("by_batchId", (q) => q.eq("batchId", args.batchId))
      .collect();

    // Add URLs to each generation
    return Promise.all(
      generations.map(async (gen) => {
        let outputUrl = null;
        let thumbnailUrl = null;

        if (gen.outputStorageId) {
          outputUrl = await ctx.storage.getUrl(gen.outputStorageId);
        }
        if (gen.thumbnailStorageId) {
          thumbnailUrl = await ctx.storage.getUrl(gen.thumbnailStorageId);
        }

        return { ...gen, outputUrl, thumbnailUrl };
      })
    );
  },
});

// Get user's generations with pagination
export const listByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("generations")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let query = ctx.db
      .query("generations")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc");

    const generations = await query.take(limit + 1);

    // Check if there are more results
    const hasMore = generations.length > limit;
    const results = hasMore ? generations.slice(0, -1) : generations;

    // Add URLs
    const withUrls = await Promise.all(
      results.map(async (gen) => {
        let outputUrl = null;
        let thumbnailUrl = null;

        if (gen.outputStorageId) {
          outputUrl = await ctx.storage.getUrl(gen.outputStorageId);
        }
        if (gen.thumbnailStorageId) {
          thumbnailUrl = await ctx.storage.getUrl(gen.thumbnailStorageId);
        }

        return { ...gen, outputUrl, thumbnailUrl };
      })
    );

    return {
      generations: withUrls,
      hasMore,
      nextCursor: hasMore ? results[results.length - 1]._id : null,
    };
  },
});

// Create a new generation (called when starting generation)
export const create = mutation({
  args: {
    userId: v.string(),
    prompt: v.string(),
    batchId: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("generations", {
      userId: args.userId,
      prompt: args.prompt,
      batchId: args.batchId,
      status: "pending",
      isPublic: args.isPublic ?? false,
      likesCount: 0,
      createdAt: Date.now(),
    });

    return id;
  },
});

// Update generation status
export const updateStatus = mutation({
  args: {
    id: v.id("generations"),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

// Update generation with output files
export const updateOutput = mutation({
  args: {
    id: v.id("generations"),
    outputStorageId: v.id("_storage"),
    thumbnailStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      outputStorageId: args.outputStorageId,
      thumbnailStorageId: args.thumbnailStorageId,
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});

// Toggle public visibility
export const togglePublic = mutation({
  args: {
    id: v.id("generations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.id);
    if (!generation) throw new Error("Generation not found");
    if (generation.userId !== args.userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      isPublic: !generation.isPublic,
      updatedAt: Date.now(),
    });

    return !generation.isPublic;
  },
});

// Delete a generation
export const remove = mutation({
  args: {
    id: v.id("generations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.id);
    if (!generation) throw new Error("Generation not found");
    if (generation.userId !== args.userId) throw new Error("Unauthorized");

    // Delete associated files from storage
    if (generation.outputStorageId) {
      await ctx.storage.delete(generation.outputStorageId);
    }
    if (generation.thumbnailStorageId) {
      await ctx.storage.delete(generation.thumbnailStorageId);
    }

    // Delete associated likes
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_generationId", (q) => q.eq("generationId", args.id))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete the generation
    await ctx.db.delete(args.id);
  },
});

// Generate upload URL for PLY file
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get storage URL
export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
