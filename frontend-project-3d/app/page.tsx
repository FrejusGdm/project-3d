"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { MinimalHeader } from "@/components/MinimalHeader";
import { Sidebar } from "@/components/Sidebar";
import { HeroInput } from "@/components/HeroInput";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { GenerationModal } from "@/components/generation/GenerationModal";
import { api } from "../../backend-project-3d/convex/_generated/api";

export default function Home() {
  const { user } = useUser();
  const startBatch = useAction(api.actions.batchGenerate.startBatch);

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("");

  const handleGenerate = async (prompt: string) => {
    if (!user) return;

    setIsGenerating(true);
    setCurrentPrompt(prompt);

    try {
      const result = await startBatch({
        userId: user.id,
        prompt,
      });
      setCurrentBatchId(result.batchId);
    } catch (error) {
      console.error("Generation failed:", error);
      setIsGenerating(false);
    }
  };

  const handleCloseModal = () => {
    setCurrentBatchId(null);
    setIsGenerating(false);
    setCurrentPrompt("");
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <MinimalHeader />
      <Sidebar />

      {/* Main Content - offset for sidebar on desktop */}
      <div className="pt-[65px] md:pl-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-serif italic font-bold tracking-tight mb-4"
            >
              Shape your imagination
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-neutral-500 mb-8"
            >
              Design custom keycaps with AI. We 3D print them for you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center"
            >
              <HeroInput
                placeholder="A keycap shaped like a tiny mountain with snow on top..."
                onSubmit={handleGenerate}
                isLoading={isGenerating}
              />
            </motion.div>

            {/* Quick suggestions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-2 mt-6"
            >
              {[
                "Cyberpunk robot head",
                "Cute cat face",
                "Crystal gem",
                "Retro arcade button",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleGenerate(suggestion)}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          </section>

          {/* Gallery Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-black">
                Community Creations
              </h2>
            </div>
            <GalleryGrid />
          </section>
        </div>
      </div>

      {/* Generation Modal */}
      <AnimatePresence>
        {currentBatchId && (
          <GenerationModal
            batchId={currentBatchId}
            prompt={currentPrompt}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
