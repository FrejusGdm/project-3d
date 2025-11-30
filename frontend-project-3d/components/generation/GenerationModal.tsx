"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../backend-project-3d/convex/_generated/api";
import { Id } from "../../../backend-project-3d/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { X, Check, Loader2, AlertCircle, Globe } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useState } from "react";

const ModelPreview = dynamic(
  () => import("../gallery/ModelPreview").then((mod) => mod.ModelPreview),
  { ssr: false }
);

interface GenerationModalProps {
  batchId: string;
  prompt: string;
  onClose: () => void;
}

export function GenerationModal({
  batchId,
  prompt,
  onClose,
}: GenerationModalProps) {
  const { user } = useUser();
  const generations = useQuery(api.generations.getByBatchId, { batchId });
  const togglePublic = useMutation(api.generations.togglePublic);
  const [selectedId, setSelectedId] = useState<Id<"generations"> | null>(null);
  const [hoveredId, setHoveredId] = useState<Id<"generations"> | null>(null);

  const handleMakePublic = async (id: Id<"generations">) => {
    if (!user) return;
    await togglePublic({ id, userId: user.id });
    setSelectedId(id);
  };

  const completedCount =
    generations?.filter((g) => g.status === "completed").length ?? 0;
  const pendingCount =
    generations?.filter(
      (g) => g.status === "pending" || g.status === "generating"
    ).length ?? 0;

  const isAllDone = pendingCount === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-black">Your Creations</h2>
            <p className="text-sm text-neutral-500 mt-1 line-clamp-1">
              &quot;{prompt}&quot;
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress indicator */}
        {!isAllDone && (
          <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
              <span className="text-sm text-neutral-600">
                Generating... {completedCount}/4 completed
              </span>
            </div>
            <div className="mt-2 h-1 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${(completedCount / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 2x2 Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {generations?.map((gen, index) => (
              <div
                key={gen._id}
                className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                  selectedId === gen._id
                    ? "border-black ring-2 ring-black/10"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
                onMouseEnter={() => setHoveredId(gen._id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {gen.status === "completed" ? (
                  <>
                    <ModelPreview
                      plyUrl={gen.outputUrl}
                      thumbnailUrl={gen.thumbnailUrl}
                      isHovered={hoveredId === gen._id}
                    />

                    {/* Actions overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-medium">
                          Variation {index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {gen.isPublic && (
                            <span className="flex items-center gap-1 text-xs text-white/80">
                              <Globe size={12} />
                              Public
                            </span>
                          )}
                          <button
                            onClick={() => handleMakePublic(gen._id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              gen.isPublic
                                ? "bg-white/20 text-white"
                                : "bg-white text-black hover:bg-neutral-100"
                            }`}
                          >
                            {gen.isPublic ? (
                              <Check size={14} />
                            ) : (
                              "Make Public"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : gen.status === "failed" ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500">
                    <AlertCircle size={32} />
                    <span className="text-sm mt-2">Generation failed</span>
                    {gen.error && (
                      <span className="text-xs text-red-400 mt-1">
                        {gen.error}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                    <span className="text-sm text-neutral-500 mt-3">
                      {gen.status === "generating"
                        ? "Generating..."
                        : "In queue..."}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Placeholder slots if not all 4 loaded yet */}
            {generations &&
              generations.length < 4 &&
              Array.from({ length: 4 - generations.length }).map((_, i) => (
                <div
                  key={`placeholder-${i}`}
                  className="aspect-square rounded-2xl border-2 border-dashed border-neutral-200 flex items-center justify-center bg-neutral-50"
                >
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-300" />
                </div>
              ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            {isAllDone
              ? "Select variations to make public and share with the community"
              : "Your creations will appear as they complete"}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
