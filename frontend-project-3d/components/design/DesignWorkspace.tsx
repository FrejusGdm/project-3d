import { useState, useRef } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { X, Upload, Loader2, ArrowRight, Wand2, Image as ImageIcon, RotateCcw, CheckCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import { TetrisLoader } from "../ui/TetrisLoader";

const ModelPreview = dynamic(
  () => import("../gallery/ModelPreview").then((mod) => mod.ModelPreview),
  { ssr: false }
);

interface DesignWorkspaceProps {
  initialPrompt: string;
  onClose: () => void;
}

const MATERIALS = [
  { id: "pbt", name: "PBT", desc: "Matte, Durable", color: "bg-neutral-200" },
  { id: "abs", name: "ABS", desc: "Smooth, Shiny", color: "bg-blue-100" },
  { id: "resin", name: "Resin", desc: "Clear, Glass-like", color: "bg-purple-100" },
  { id: "metal", name: "Metal", desc: "Polished", color: "bg-yellow-100" },
  { id: "wood", name: "Wood", desc: "Natural Grain", color: "bg-orange-100" },
  { id: "pom", name: "POM", desc: "Smooth, Thocky", color: "bg-pink-100" },
];

const PROFILES = [
  { id: "cherry", name: "Cherry", desc: "Standard Low" },
  { id: "oem", name: "OEM", desc: "Standard High" },
  { id: "sa", name: "SA", desc: "Tall Retro" },
  { id: "xda", name: "XDA", desc: "Flat Wide" },
];

const KEY_TYPES = [
  { id: "1u", name: "1u", desc: "Standard" },
  { id: "spacebar", name: "Space", desc: "6.25u" },
  { id: "enter", name: "Enter", desc: "2.25u" },
];

const TECHNIQUES = [
  { id: "standard", name: "Print", desc: "Standard" },
  { id: "doubleshot", name: "Double", desc: "Crisp Text" },
  { id: "resin_cast", name: "Cast", desc: "Embedded" },
];

const EXAMPLE_PROMPTS = [
  { 
    label: "Cyberpunk", 
    emoji: "🌃",
    prompt: "A futuristic cyberpunk city skyline at night, neon lights, rain-slicked streets, dark atmosphere.", 
    material: "resin", 
    profile: "sa",
    keyType: "spacebar",
    technique: "resin_cast"
  },
  { 
    label: "Retro", 
    emoji: "💾",
    prompt: "Vintage computer terminal aesthetics, beige plastic, green phosphor glow, command prompt text.", 
    material: "pbt", 
    profile: "sa",
    keyType: "1u",
    technique: "doubleshot"
  },
  { 
    label: "Crystal", 
    emoji: "🔮",
    prompt: "A mythical dragon scale texture, translucent crystal, internal glowing fire core.", 
    material: "resin", 
    profile: "cherry",
    keyType: "1u",
    technique: "resin_cast"
  },
  { 
    label: "Gold", 
    emoji: "🏆",
    prompt: "Solid gold bullion bar look, stamped weight markings, highly reflective polished surface.", 
    material: "metal", 
    profile: "oem",
    keyType: "enter",
    technique: "standard"
  }
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
  const [profile, setProfile] = useState("cherry");
  const [keyType, setKeyType] = useState("1u");
  const [technique, setTechnique] = useState("standard");
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
        profile,
        keyType,
        technique,
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
        <div className="w-full md:w-[400px] border-r border-neutral-100 flex flex-col bg-neutral-50/80 backdrop-blur-xl">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white/50">
            <h2 className="text-lg font-semibold">Design Studio</h2>
            <button onClick={onClose} className="p-2 hover:bg-neutral-200 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
            {/* Prompt Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-500" />
                  Description
                </label>
              </div>
              
              {/* Inspiration Chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setPrompt(ex.prompt);
                      setMaterial(ex.material);
                      setProfile(ex.profile);
                      setKeyType(ex.keyType);
                      setTechnique(ex.technique);
                    }}
                    disabled={step === "generating" || step === "completed"}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-xs font-medium text-neutral-600 hover:border-blue-400 hover:text-blue-600 transition-all whitespace-nowrap shadow-sm"
                  >
                    <span>{ex.emoji}</span>
                    {ex.label}
                  </button>
                ))}
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={step === "generating" || step === "completed"}
                className="w-full p-4 rounded-2xl border border-neutral-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all min-h-[120px] resize-none disabled:opacity-50 text-sm shadow-sm placeholder:text-neutral-400"
                placeholder="Describe your dream keycap..."
              />
            </div>

            {/* Technical Specs Grid */}
            <div className="space-y-4">
               <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Specifications</h3>
               
               {/* Profile & Type Row */}
               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-500 ml-1">Profile</label>
                    <div className="relative">
                      <select
                        value={profile}
                        onChange={(e) => setProfile(e.target.value)}
                        disabled={step === "generating" || step === "completed"}
                        className="w-full p-2.5 pl-3 pr-8 rounded-xl border border-neutral-200 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-50 appearance-none cursor-pointer hover:border-neutral-300 transition-colors"
                      >
                        {PROFILES.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <ArrowRight size={12} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-500 ml-1">Size</label>
                    <div className="relative">
              <select
                        value={keyType}
                        onChange={(e) => setKeyType(e.target.value)}
                disabled={step === "generating" || step === "completed"}
                        className="w-full p-2.5 pl-3 pr-8 rounded-xl border border-neutral-200 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-50 appearance-none cursor-pointer hover:border-neutral-300 transition-colors"
                      >
                        {KEY_TYPES.map((k) => (
                          <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <ArrowRight size={12} className="rotate-90" />
                      </div>
                    </div>
                  </div>
               </div>

               {/* Material Grid */}
               <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 ml-1">Material</label>
                  <div className="grid grid-cols-3 gap-2">
                    {MATERIALS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMaterial(m.id)}
                        disabled={step === "generating" || step === "completed"}
                        className={`
                          flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center gap-1
                          ${material === m.id 
                            ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500" 
                            : "border-neutral-100 bg-white text-neutral-600 hover:border-neutral-200 hover:bg-neutral-50"}
                        `}
                      >
                        <span className="text-xs font-semibold">{m.name}</span>
                        <span className="text-[10px] opacity-60 leading-none">{m.desc.split(',')[0]}</span>
                      </button>
                    ))}
                  </div>
               </div>

               {/* Technique */}
               <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 ml-1">Technique</label>
                  <div className="flex p-1 bg-neutral-100 rounded-xl">
                    {TECHNIQUES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTechnique(t.id)}
                        disabled={step === "generating" || step === "completed"}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all
                          ${technique === t.id 
                            ? "bg-white text-black shadow-sm" 
                            : "text-neutral-500 hover:text-neutral-700"}
                        `}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            {/* Reference Image */}
            <div className="space-y-2 pt-2">
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
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <TetrisLoader />
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
        unoptimized
      />
    </div>
  );
}

function useStorageUrl(storageId: Id<"_storage">) {
    const url = useQuery(api.generations.getStorageUrl, { storageId });
    return url;
}

