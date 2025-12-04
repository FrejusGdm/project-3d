"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

const PIPELINE_URL = process.env.PIPELINE_URL || "http://localhost:8000";

export const generateImage = action({
  args: {
    prompt: v.string(),
    material: v.optional(v.string()),
    referenceStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<{ storageId: Id<"_storage">; backendPath: string }> => {
    let finalPrompt = args.prompt;
    if (args.material) {
      finalPrompt += `, made of ${args.material} material, ${args.material} texture`;
    }

    const formData = new FormData();
    formData.append("prompt", finalPrompt);
    formData.append("image_model", "nanobanana");

    if (args.referenceStorageId) {
      const imageUrl = await ctx.storage.getUrl(args.referenceStorageId);
      if (imageUrl) {
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const blob = await imageResponse.blob();
          formData.append("ref_image", blob, "reference.png");
        }
      }
    }

    console.log(`[design] Generating image with prompt: ${finalPrompt}`);
    const response = await fetch(`${PIPELINE_URL}/generate/image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[design] Image generation failed. Status: ${response.status}, Body: ${errorText}`);
      throw new Error(`Image generation failed: ${errorText}`);
    }

    const result = await response.json();
    // Result: { id, url, path }

    // Download the generated image to store in Convex for display
    const imageUrl = `${PIPELINE_URL}${result.url}`;
    const imageFetch = await fetch(imageUrl);
    if (!imageFetch.ok) throw new Error("Failed to download generated image");
    
    const imageBlob = await imageFetch.blob();
    const uploadUrl = await ctx.runMutation(api.generations.generateUploadUrl, {});
    
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": imageBlob.type },
      body: imageBlob,
    });

    if (!uploadResponse.ok) throw new Error("Failed to upload image to storage");
    const { storageId } = (await uploadResponse.json()) as { storageId: Id<"_storage"> };

    return {
      storageId,
      backendPath: result.path,
    };
  },
});

export const generateModel = action({
  args: {
    imagePath: v.string(),
    prompt: v.string(), // Just for record keeping if needed, or ignoring
    userId: v.string(),
    thumbnailStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<Id<"generations">> => {
    console.log(`[design] Generating 3D model from path: ${args.imagePath}`);
    
    // 1. Create a pending generation record
    const generationId: Id<"generations"> = await ctx.runMutation(api.generations.create, {
        userId: args.userId,
        prompt: args.prompt,
        isPublic: false,
    });

    await ctx.runMutation(api.generations.updateStatus, {
        id: generationId,
        status: "generating",
    });

    try {
        // 2. Call backend
        const response = await fetch(`${PIPELINE_URL}/generate/3d`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image_path: args.imagePath,
                three_d_model: "trellis",
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`3D generation failed: ${text}`);
        }

        const result = await response.json();
        // Result: { id, format, location, path }

        // 3. Download PLY and store
        const filesUrl = `${PIPELINE_URL}/files/${result.path}`;
        const plyResponse = await fetch(filesUrl);
        if (!plyResponse.ok) throw new Error("Failed to download PLY file");
        
        const plyBlob = await plyResponse.blob();
        const uploadUrl = await ctx.runMutation(api.generations.generateUploadUrl, {});
        
        const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: plyBlob,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload PLY");
        const { storageId } = (await uploadResponse.json()) as { storageId: Id<"_storage"> };

        // 4. Update generation record
        await ctx.runMutation(api.generations.updateOutput, {
            id: generationId,
            outputStorageId: storageId,
            thumbnailStorageId: args.thumbnailStorageId,
        });

        return generationId;

    } catch (e: any) {
        console.error("3D Generation error:", e);
        await ctx.runMutation(api.generations.updateStatus, {
            id: generationId,
            status: "failed",
            error: e.message || String(e),
        });
        throw e;
    }
  },
});

