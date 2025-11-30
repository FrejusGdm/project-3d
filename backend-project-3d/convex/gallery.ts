import { v } from "convex/values";
import { query } from "./_generated/server";

// Get public gallery with pagination
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // Use createdAt timestamp for cursor
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let queryBuilder = ctx.db
      .query("generations")
      .withIndex("by_isPublic_createdAt", (q) => q.eq("isPublic", true))
      .order("desc");

    // If cursor provided, filter to items before that timestamp
    const allGenerations = await queryBuilder.collect();

    let generations = allGenerations;
    if (args.cursor) {
      generations = allGenerations.filter((g) => g.createdAt < args.cursor!);
    }

    // Take limit + 1 to check if there are more
    const results = generations.slice(0, limit + 1);
    const hasMore = results.length > limit;
    const finalResults = hasMore ? results.slice(0, -1) : results;

    // Add URLs to each generation
    const withUrls = await Promise.all(
      finalResults.map(async (gen) => {
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
      nextCursor: hasMore ? finalResults[finalResults.length - 1].createdAt : null,
    };
  },
});

// Get featured/trending generations (most liked in recent time period)
export const trending = query({
  args: {
    limit: v.optional(v.number()),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const daysBack = args.daysBack ?? 7;
    const cutoffTime = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    // Get all public generations from the time period
    const generations = await ctx.db
      .query("generations")
      .withIndex("by_isPublic_createdAt", (q) => q.eq("isPublic", true))
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    // Sort by likes count
    const sorted = generations.sort((a, b) => b.likesCount - a.likesCount);
    const topGenerations = sorted.slice(0, limit);

    // Add URLs
    const withUrls = await Promise.all(
      topGenerations.map(async (gen) => {
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

    return withUrls;
  },
});

// Search generations by prompt (simple text search)
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchTerm = args.query.toLowerCase();

    // Get all public generations and filter by prompt
    // Note: For production, consider using a proper search index
    const generations = await ctx.db
      .query("generations")
      .withIndex("by_isPublic_createdAt", (q) => q.eq("isPublic", true))
      .order("desc")
      .collect();

    const filtered = generations
      .filter((gen) => gen.prompt.toLowerCase().includes(searchTerm))
      .slice(0, limit);

    // Add URLs
    const withUrls = await Promise.all(
      filtered.map(async (gen) => {
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

    return withUrls;
  },
});

// Get stats for the gallery
export const stats = query({
  handler: async (ctx) => {
    const allPublic = await ctx.db
      .query("generations")
      .withIndex("by_isPublic_createdAt", (q) => q.eq("isPublic", true))
      .collect();

    const totalLikes = allPublic.reduce((sum, gen) => sum + gen.likesCount, 0);

    return {
      totalGenerations: allPublic.length,
      totalLikes,
    };
  },
});
