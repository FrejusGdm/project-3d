"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { MinimalHeader } from "@/components/MinimalHeader";
import { HeroInput } from "@/components/HeroInput";
import { Placeholder3D } from "@/components/Placeholder3D";
import { Cuboid, RotateCcw, Download, Maximize2 } from "lucide-react";

// Dynamic import with SSR disabled to prevent R3F hooks from running on server
const Scene3D = dynamic(
  () => import("@/components/Scene3D").then((mod) => mod.Scene3D),
  { ssr: false }
);

const LOADING_STEPS = [
  "Forging geometry...",
  "Extruding shapes...",
  "Polishing surfaces...",
  "Applying textures...",
  "Finalizing build..."
];

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loadingText, setLoadingText] = useState(LOADING_STEPS[0]);

  const handleStart = (value: string) => {
    setPrompt(value);
    setHasStarted(true);
    setIsGenerating(true);
    
    // Simulate generation delay (longer to show off animation)
    setTimeout(() => setIsGenerating(false), 5000);
  };

  const handleReset = () => {
    setHasStarted(false);
    setPrompt("");
    setIsGenerating(false);
    setLoadingText(LOADING_STEPS[0]);
  };

  // Cycle through loading texts
  useEffect(() => {
    if (!isGenerating) return;
    
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % LOADING_STEPS.length;
      setLoadingText(LOADING_STEPS[step]);
    }, 800); // Change text every 800ms

    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground selection:bg-foreground selection:text-background overflow-hidden">
      <MinimalHeader onLogoClick={hasStarted ? handleReset : undefined} />
      
      {/* Main Content Area */}
      <div className="flex-1 relative w-full max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col">
        
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            // LANDING STATE
            <motion.section 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center relative w-full"
            >
              {/* Floating 3D Element Background Layer */}
              <div className="absolute inset-0 z-0 flex items-center justify-center opacity-50 pointer-events-none overflow-hidden">
                <Placeholder3D /> 
              </div>

              {/* Main Interaction Layer */}
              <div className="z-10 w-full max-w-4xl px-6 space-y-12 text-center flex flex-col items-center">
                  <div className="space-y-3">
                    <motion.h1
                      layoutId="main-title"
                      className="text-5xl md:text-7xl font-serif italic font-bold tracking-tighter leading-tight"
                    >
                      Vibe build.
                    </motion.h1>
                    <p className="text-lg md:text-xl text-neutral-500">
                      Design and iterate custom keycaps. We 3D print them.
                    </p>
                  </div>

                  <motion.div layoutId="hero-input" className="w-full max-w-2xl">
                    <HeroInput 
                      placeholder="I want to build a..." 
                      onSubmit={handleStart}
                    />
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-3 md:gap-6 justify-center text-xs md:text-sm text-neutral-500 font-mono tracking-wide uppercase"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-800"></span> 
                      01. Prompt
                    </span>
                    <span className="text-neutral-300">→</span>
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
                      02. Generate
                    </span>
                    <span className="text-neutral-300">→</span>
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
                      03. Order
                    </span>
                  </motion.div>
              </div>
            </motion.section>
          ) : (
            // WORKSPACE STATE
            <motion.section 
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6 h-full pt-20 pb-6"
            >
              {/* LEFT COLUMN: Chat & History */}
              <div className="flex flex-col h-full gap-6 max-h-[calc(100vh-140px)]">
                <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                  {/* Mock History */}
                  <div className="space-y-8">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-black shrink-0" />
                      <div className="space-y-2">
                        <p className="font-medium text-sm text-neutral-500">YOU</p>
                        <p className="text-lg leading-relaxed text-black">{prompt}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 shrink-0 flex items-center justify-center">
                        <span className="text-xs font-mono text-black">AI</span>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-sm text-neutral-500">FORGE</p>
                        <div className="text-lg leading-relaxed text-neutral-800">
                          {isGenerating ? (
                            <div className="flex items-center gap-2 text-neutral-500 italic">
                                <span>{loadingText}</span>
                                <span className="inline-block w-1.5 h-1.5 bg-neutral-400 rounded-full animate-pulse"/>
                            </div>
                          ) : (
                             "Here is your generated model based on the prompt."
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Input Area */}
                <motion.div layoutId="hero-input" className="w-full shrink-0">
                  <HeroInput placeholder="Refine your design..." onSubmit={(val) => console.log(val)} />
                </motion.div>
              </div>

              {/* RIGHT COLUMN: 3D Canvas (Gemini Style) */}
              <div className="flex flex-col rounded-3xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
                 {/* Canvas Header */}
                 <div className="h-14 border-b border-neutral-100 flex items-center justify-between px-6 bg-white z-10">
                    <div className="flex items-center gap-3 text-sm font-medium text-neutral-600">
                      <Cuboid size={16} />
                      <span>{isGenerating ? "Generating..." : "Model Preview"}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500" title="Reset View">
                        <RotateCcw size={16} />
                      </button>
                      <div className="w-px h-4 bg-neutral-200 mx-1" />
                      <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-xs font-medium text-neutral-600">
                        <Download size={14} />
                        Export
                      </button>
                      <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500">
                         <Maximize2 size={16} />
                      </button>
                    </div>
                 </div>

                 {/* Canvas Area */}
                 <div className="relative flex-1 bg-neutral-50/50">
                    <Scene3D isLoading={isGenerating} />
                 </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
