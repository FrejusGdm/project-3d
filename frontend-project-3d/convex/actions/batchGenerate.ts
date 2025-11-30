"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

// Batch generate 4 variations in parallel
export const startBatch = action({
  args: {
    userId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args): Promise<{ batchId: string; generationIds: Id<"generations">[] }> => {
    const batchId = crypto.randomUUID();

    // Create 4 pending generation records
    const generationIds: Id<"generations">[] = [];
    for (let i = 0; i < 4; i++) {
      const id = await ctx.runMutation(api.generations.create, {
        userId: args.userId,
        prompt: args.prompt,
        batchId,
        isPublic: false, // User will choose which to make public
      });
      generationIds.push(id);
    }

    // Schedule 4 parallel generation actions
    // Each will have a slightly different variation index for potential seed variation
    for (let i = 0; i < 4; i++) {
      await ctx.scheduler.runAfter(0, internal.actions.batchGenerate.generateSingle, {
        generationId: generationIds[i],
        prompt: args.prompt,
        variationIndex: i,
      });
    }

    return { batchId, generationIds };
  },
});

// Internal action to generate a single model
export const generateSingle = internalAction({
  args: {
    generationId: v.id("generations"),
    prompt: v.string(),
    variationIndex: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Update status to generating
      await ctx.runMutation(api.generations.updateStatus, {
        id: args.generationId,
        status: "generating",
      });

      // Enhance prompt with variation hint for diversity
      const variationHints = [
        "", // Original prompt
        " with unique artistic interpretation",
        " with creative variation",
        " with alternative design approach",
      ];
      const enhancedPrompt = args.prompt + variationHints[args.variationIndex];

      // Call Python pipeline via HTTP endpoint
      // The Python pipeline should be exposed as an HTTP action
      const response = await fetch(`${process.env.PIPELINE_URL || "http://localhost:8000"}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          image_model: "nanobanana",
          three_d_model: "trellis",
        }),
      });

      if (!response.ok) {
        throw new Error(`Pipeline failed: ${response.statusText}`);
      }

      const result = await response.json();
      // Result: { id, format, location, path }

      // Read the PLY file and upload to Convex storage
      const plyResponse = await fetch(`${process.env.PIPELINE_URL || "http://localhost:8000"}/files/${result.path}`);
      if (!plyResponse.ok) {
        throw new Error("Failed to fetch PLY file");
      }
      const plyBlob = await plyResponse.blob();

      // Get upload URL and upload PLY
      const uploadUrl = await ctx.runMutation(api.generations.generateUploadUrl, {});
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: plyBlob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload PLY to storage");
      }

      const { storageId } = await uploadResponse.json();

      // Update generation with the output
      await ctx.runMutation(api.generations.updateOutput, {
        id: args.generationId,
        outputStorageId: storageId,
      });

    } catch (error) {
      // Mark as failed
      await ctx.runMutation(api.generations.updateStatus, {
        id: args.generationId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});
