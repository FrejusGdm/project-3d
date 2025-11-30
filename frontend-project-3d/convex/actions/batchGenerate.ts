"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

// Number of variations to generate (reduced from 4 to 2 for faster testing)
const NUM_VARIATIONS = 2;

// Batch generate variations in parallel
export const startBatch = action({
  args: {
    userId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args): Promise<{ batchId: string; generationIds: Id<"generations">[] }> => {
    const batchId = crypto.randomUUID();

    // Create pending generation records
    const generationIds: Id<"generations">[] = [];
    for (let i = 0; i < NUM_VARIATIONS; i++) {
      const id = await ctx.runMutation(api.generations.create, {
        userId: args.userId,
        prompt: args.prompt,
        batchId,
        isPublic: false, // User will choose which to make public
      });
      generationIds.push(id);
    }

    // Schedule parallel generation actions
    // Each will have a slightly different variation index for potential seed variation
    for (let i = 0; i < NUM_VARIATIONS; i++) {
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
      const pipelineUrl = process.env.PIPELINE_URL || "http://localhost:8000";
      const generateUrl = `${pipelineUrl}/generate`;
      
      console.log(`[generateSingle] Calling pipeline at: ${generateUrl}`);
      console.log(`[generateSingle] PIPELINE_URL env var: ${process.env.PIPELINE_URL || "NOT SET (using default)"}`);
      
      let response: Response;
      try {
        response = await fetch(generateUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            image_model: "nanobanana",
            three_d_model: "trellis",
          }),
        });
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error 
          ? `Fetch failed: ${fetchError.message}. URL: ${generateUrl}`
          : `Fetch failed: Unknown error. URL: ${generateUrl}`;
        console.error(`[generateSingle] ${errorMessage}`, fetchError);
        throw new Error(errorMessage);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        const errorMessage = `Pipeline failed (${response.status}): ${errorText}`;
        console.error(`[generateSingle] ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      // Result: { id, format, location, path }

      // Read the PLY file and upload to Convex storage
      const filesUrl = `${pipelineUrl}/files/${result.path}`;
      console.log(`[generateSingle] Fetching PLY file from: ${filesUrl}`);
      
      let plyResponse: Response;
      try {
        plyResponse = await fetch(filesUrl);
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error
          ? `Failed to fetch PLY file: ${fetchError.message}. URL: ${filesUrl}`
          : `Failed to fetch PLY file: Unknown error. URL: ${filesUrl}`;
        console.error(`[generateSingle] ${errorMessage}`, fetchError);
        throw new Error(errorMessage);
      }
      
      if (!plyResponse.ok) {
        const errorText = await plyResponse.text().catch(() => plyResponse.statusText);
        const errorMessage = `Failed to fetch PLY file (${plyResponse.status}): ${errorText}`;
        console.error(`[generateSingle] ${errorMessage}`);
        throw new Error(errorMessage);
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
      // Mark as failed with detailed error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === "string"
        ? error
        : JSON.stringify(error);
      
      console.error(`[generateSingle] Generation failed for ${args.generationId}:`, errorMessage);
      console.error(`[generateSingle] Full error:`, error);
      
      await ctx.runMutation(api.generations.updateStatus, {
        id: args.generationId,
        status: "failed",
        error: errorMessage,
      });
    }
  },
});
