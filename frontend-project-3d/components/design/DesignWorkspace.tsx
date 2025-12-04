import { useState, useRef } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { X, Upload, Loader2, ArrowRight, Wand2, Image as ImageIcon, RotateCcw, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";

const ModelPreview = dynamic(
  () => import("../gallery/ModelPreview").then((mod) => mod.ModelPreview),
  { ssr: false }
);

interface DesignWorkspaceProps {
  initialPrompt: string;
  onClose: () => void;
}

const MATERIALS = [
  { id: "pbt", name: "PBT (Matte, Durable)" },
  { id: "abs", name: "ABS (Smooth, Shiny)" },
  { id: "resin", name: "Clear Resin" },
  { id: "metal", name: "Metal/Gold" },
  { id: "wood", name: "Wood" },
  { id: "rubber", name: "Rubber" },
];

export function DesignWorkspace({
  initialPrompt,
  onClose,
}: DesignWorkspaceProps) {
  const { user } = useUser();
  
  // Actions & Mutations
  const generateUploadUrl = useMutation(api.generations.generateUploadUrl);
  const generateImageAction = useAction(api.actions.design.generateImage);
  const generateModelAction = useAction(api.actions.design.generateModel);

  // State
  const [step, setStep] = useState<"design" | "preview" | "generating" | "completed">("design");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [material, setMaterial] = useState("pbt");
  const [refImage, setRefImage] = useState<File | null>(null);
  const [refImagePreview, setRefImagePreview] = useState<string | null>(null);
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{
    storageId: Id<"_storage">;
    backendPath: string;
    url: string;
  } | null>(null);
  
  const [finalGenerationId, setFinalGenerationId] = useState<Id<"generations"> | null>(null);
  
  // Query final generation when available
  const finalGeneration = useQuery(api.generations.get, 
    finalGenerationId ? { id: finalGenerationId } : "skip"
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRefImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setRefImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!user) return;
    setIsGeneratingImage(true);

    try {
      let refStorageId: Id<"_storage"> | undefined;

      // 1. Upload reference image if exists
      if (refImage) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": refImage.type },
          body: refImage,
        });
        if (!result.ok) throw new Error("Upload failed");
        const { storageId } = await result.json();
        refStorageId = storageId;
      }

      // 2. Generate Design Image
      const result = await generateImageAction({
        prompt,
        material,
        referenceStorageId: refStorageId,
      });

      setGeneratedImage({
        storageId: result.storageId,
        backendPath: result.backendPath,
        url: "",
      });
      
      setStep("preview");
    } catch (e) {
      console.error(e);
      alert("Failed to generate design. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerate3D = async () => {
    if (!user || !generatedImage) return;
    setStep("generating");
    
    try {
      const generationId = await generateModelAction({
        imagePath: generatedImage.backendPath,
        prompt,
        userId: user.id,
        thumbnailStorageId: generatedImage.storageId,
      });
      setFinalGenerationId(generationId);
      setStep("completed");
    } catch (e) {
      console.error(e);
      alert("Failed to start 3D generation.");
      setStep("preview");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Panel: Controls */}
        <div className="w-full md:w-1/3 border-r border-neutral-100 flex flex-col bg-neutral-50/50">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Design Studio</h2>
            <button onClick={onClose} className="p-2 hover:bg-neutral-200 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Prompt */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Description</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={step === "generating" || step === "completed"}
                className="w-full p-3 rounded-xl border border-neutral-200 focus:border-black focus:ring-0 transition-all min-h-[100px] resize-none disabled:opacity-50"
                placeholder="Describe your keycap..."
              />
            </div>

            {/* Material */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Material</label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                disabled={step === "generating" || step === "completed"}
                className="w-full p-3 rounded-xl border border-neutral-200 focus:border-black focus:ring-0 bg-white disabled:opacity-50"
              >
                {MATERIALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference Image */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Reference Image (Optional)</label>
              <div
                onClick={() => step !== "generating" && step !== "completed" && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-neutral-200 rounded-xl p-4 transition-colors flex flex-col items-center justify-center gap-2 min-h-[120px]
                  ${step === "generating" || step === "completed" ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-100 cursor-pointer"}
                `}
              >
                {refImagePreview ? (
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                    <Image 
                      src={refImagePreview} 
                      alt="Reference" 
                      fill
                      className="object-cover" 
                    />
                    {step !== "generating" && step !== "completed" && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-medium">Change Image</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload size={20} className="text-neutral-400" />
                    <p className="text-xs text-neutral-400 text-center">Click to upload<br />reference</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={step === "generating" || step === "completed"}
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-neutral-100">
            {step === "completed" ? (
              <div className="text-center space-y-2">
                <div className="flex justify-center text-green-500 mb-2">
                   <CheckCircle size={32} />
                </div>
                <p className="font-medium">Model Generated!</p>
                <button 
                  onClick={onClose}
                  className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-neutral-800 transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !prompt.trim() || step === "generating"}
                className="w-full py-3 bg-black text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-50 transition-all"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Designing...
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    {step === "design" ? "Generate Design" : "Regenerate Design"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="flex-1 bg-white flex flex-col relative">
          {step === "design" && !generatedImage ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-10 text-center">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                <ImageIcon size={32} className="opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-neutral-600 mb-2">Ready to Design</h3>
              <p className="max-w-xs">Describe your keycap and select a material to generate a visualization.</p>
            </div>
          ) : (
            <div className="flex-1 relative p-6 flex flex-col">
              <h3 className="text-lg font-semibold mb-4">
                {step === "completed" ? "Final Result" : "Design Preview"}
              </h3>
              
              <div className="flex-1 bg-neutral-50 rounded-2xl overflow-hidden flex items-center justify-center border border-neutral-100 relative group">
                {step === "completed" && finalGeneration?.outputUrl ? (
                  <ModelPreview 
                    plyUrl={finalGeneration.outputUrl} 
                    thumbnailUrl={finalGeneration.thumbnailUrl || (generatedImage && "")} // Use generated image as thumb fallback if possible, but ModelPreview handles null
                    isHovered={true}
                  />
                ) : (
                  generatedImage && <StorageImage storageId={generatedImage.storageId} />
                )}
                
                {step === "generating" && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <p className="font-medium">Generating 3D Model...</p>
                    <p className="text-sm opacity-80 mt-2">This takes about 1-2 minutes</p>
                  </div>
                )}
              </div>

              {generatedImage && step === "preview" && (
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setStep("design")} // Just allows re-editing inputs
                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Refine
                  </button>
                  <button
                    onClick={handleGenerate3D}
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
                  >
                    Make it 3D
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper component to load image from Storage ID
function StorageImage({ storageId }: { storageId: Id<"_storage"> }) {
  const imageUrl = useStorageUrl(storageId);

  if (!imageUrl) {
    return <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-neutral-300" /></div>;
  }

  return (
    <div className="relative w-full h-full">
      <Image 
        src={imageUrl} 
        alt="Generated Design" 
        fill
        className="object-contain" 
      />
    </div>
  );
}

function useStorageUrl(storageId: Id<"_storage">) {
    const url = useQuery(api.generations.getStorageUrl, { storageId });
    return url;
}

