import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Stores each generated 3D model
  generations: defineTable({
    userId: v.string(), // Clerk user ID
    prompt: v.string(), // User's text prompt
    batchId: v.optional(v.string()), // Groups 4 variations together
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    // Convex file storage IDs
    outputStorageId: v.optional(v.id("_storage")), // PLY file
    thumbnailStorageId: v.optional(v.id("_storage")), // Preview image from Gemini
    // Visibility and social
    isPublic: v.boolean(),
    likesCount: v.number(), // Denormalized for performance
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    // Error tracking
    error: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_batchId", ["batchId"])
    .index("by_isPublic_createdAt", ["isPublic", "createdAt"])
    .index("by_status", ["status"]),

  // Tracks user likes on generations
  likes: defineTable({
    userId: v.string(), // Clerk user ID
    generationId: v.id("generations"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_generationId", ["userId", "generationId"])
    .index("by_generationId", ["generationId"]),
});
