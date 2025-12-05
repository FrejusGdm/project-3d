"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

const PIPELINE_URL = process.env.PIPELINE_URL || "http://localhost:8000";

const MATERIAL_PROMPTS: Record<string, string> = {
  pbt: "PBT plastic with matte, slightly grainy textured surface, no shine, durable look",
  abs: "ABS plastic with smooth glossy surface, slight reflectivity, vibrant colors",
  resin: "transparent clear resin, glass-like with subtle internal reflections, depth",
  metal: "polished metal with brushed metallic finish and reflective highlights, machined look",
  wood: "natural wood grain texture, warm organic tones, matte finish",
  rubber: "soft-touch silicone rubber, matte finish, non-reflective",
  pom: "POM plastic, ultra-smooth semi-glossy surface, milky diffusion",
  polycarbonate: "polycarbonate plastic, frosted translucent look, light diffusion",
};

const PROFILE_PROMPTS: Record<string, string> = {
  cherry: "Cherry profile keycap (9.4mm height), low sculpted with subtle cylindrical top curve, sharp edges",
  oem: "OEM profile keycap (11.9mm height), medium height with cylindrical sculpted top, standard mechanical look",
  sa: "SA profile keycap (16.5mm tall), high spherical sculpted top, retro typewriter aesthetic, thick walls",
  dsa: "DSA profile keycap (7.6mm height), flat uniform top surface, low profile, minimalist",
  xda: "XDA profile keycap (9.1mm height), wide flat top surface, modern aesthetic, rounded corners",
  artisan: "Artisan sculptural keycap, artistic 3D design breaking traditional shape rules",
};

const TYPE_PROMPTS: Record<string, string> = {
  "1u": "Standard 1u square keycap (19.05mm x 19.05mm)",
  "spacebar": "Long horizontal 6.25u spacebar keycap, elongated form",
  "enter": "Rectangular 2.25u Enter keycap, landscape orientation",
  "shift": "Rectangular 2.25u Shift keycap, landscape orientation",
};

const TECHNIQUE_PROMPTS: Record<string, string> = {
  "standard": "standard surface printing",
  "doubleshot": "double-shot injection molding, crisp high-contrast legends",
  "resin_cast": "encapsulated resin casting, internal objects embedded inside clear resin",
};

export const generateImage = action({
  args: {
    prompt: v.string(),
    material: v.optional(v.string()),
    profile: v.optional(v.string()),
    keyType: v.optional(v.string()),
    technique: v.optional(v.string()),
    referenceStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<{ storageId: Id<"_storage">; backendPath: string }> => {
    // 1. Construct "Smart Prompt"
    const profilePrompt = args.profile ? PROFILE_PROMPTS[args.profile] || "" : "Cherry profile keycap";
    const materialPrompt = args.material ? MATERIAL_PROMPTS[args.material] || "" : "";
    const typePrompt = args.keyType ? TYPE_PROMPTS[args.keyType] || "Standard 1u keycap" : "Standard 1u keycap";
    const techniquePrompt = args.technique ? TECHNIQUE_PROMPTS[args.technique] || "" : "";

    // Structure: [Subject/Dimensions] + [Profile] + [Material] + [Technique] + [Context/Lighting] + [User Design]
    const systemContext = `A close-up 3D render of a single mechanical keyboard keycap. Shape/Dimensions: ${typePrompt}, ${profilePrompt}. Material: ${materialPrompt}. Technique: ${techniquePrompt}. View: Isometric view showing top and side surfaces clearly. Background: Neutral studio lighting, solid background.`;

    const finalPrompt = `${systemContext} Design Description: ${args.prompt}`;

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

