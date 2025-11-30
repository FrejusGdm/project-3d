"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { MinimalHeader } from "@/components/MinimalHeader";
import { Sidebar } from "@/components/Sidebar";
import { LikeButton } from "@/components/gallery/LikeButton";
import {
  Loader2,
  ArrowLeft,
  Download,
  Globe,
  Lock,
  Trash2,
  Calendar,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { api } from "../../../../backend-project-3d/convex/_generated/api";
import { Id } from "../../../../backend-project-3d/convex/_generated/dataModel";

const ModelPreview = dynamic(
  () => import("@/components/gallery/ModelPreview").then((mod) => mod.ModelPreview),
  { ssr: false }
);

export default function GenerationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [isHovered, setIsHovered] = useState(true); // Show 3D by default on detail page

  const generationId = params.id as Id<"generations">;

  const generation = useQuery(api.generations.get, { id: generationId });
  const hasLiked = useQuery(
    api.likes.hasLiked,
    user ? { userId: user.id, generationId } : "skip"
  );

  const togglePublic = useMutation(api.generations.togglePublic);
  const removeGeneration = useMutation(api.generations.remove);

  if (generation === undefined) {
    return (
      <main className="min-h-screen bg-white text-black">
        <MinimalHeader />
        <Sidebar />
        <div className="pt-[65px] md:pl-20 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      </main>
    );
  }

  if (generation === null) {
    return (
      <main className="min-h-screen bg-white text-black">
        <MinimalHeader />
        <Sidebar />
        <div className="pt-[65px] md:pl-20">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 text-center">
            <h1 className="text-2xl font-medium mb-4">Generation not found</h1>
            <button
              onClick={() => router.back()}
              className="text-neutral-500 hover:text-black transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isOwner = user?.id === generation.userId;

  const handleTogglePublic = async () => {
    if (!user || !isOwner) return;
    await togglePublic({ id: generationId, userId: user.id });
  };

  const handleDelete = async () => {
    if (!user || !isOwner) return;
    if (confirm("Are you sure you want to delete this generation?")) {
      await removeGeneration({ id: generationId, userId: user.id });
      router.push("/my-generations");
    }
  };

  const handleDownload = () => {
    if (generation.outputUrl) {
      window.open(generation.outputUrl, "_blank");
    }
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <MinimalHeader />
      <Sidebar />

      <div className="pt-[65px] md:pl-20">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-500 hover:text-black transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 3D Preview */}
            <div
              className="aspect-square rounded-2xl overflow-hidden bg-neutral-50 border border-neutral-200"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <ModelPreview
                plyUrl={generation.outputUrl}
                thumbnailUrl={generation.thumbnailUrl}
                isHovered={isHovered}
              />
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-black mb-3">
                  {generation.prompt}
                </h1>
                <div className="flex items-center gap-4 text-sm text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {new Date(generation.createdAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {generation.isPublic ? (
                      <>
                        <Globe size={14} />
                        Public
                      </>
                    ) : (
                      <>
                        <Lock size={14} />
                        Private
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Like button */}
              <div className="flex items-center gap-4">
                <LikeButton
                  generationId={generationId}
                  initialLikesCount={generation.likesCount}
                  initialLiked={hasLiked ?? false}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownload}
                  disabled={!generation.outputUrl}
                  className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Download size={16} />
                  Download PLY
                </button>

                {isOwner && (
                  <>
                    <button
                      onClick={handleTogglePublic}
                      className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors"
                    >
                      {generation.isPublic ? (
                        <>
                          <Lock size={16} />
                          Make Private
                        </>
                      ) : (
                        <>
                          <Globe size={16} />
                          Make Public
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                )}
              </div>

              {/* Status */}
              {generation.status !== "completed" && (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center gap-3">
                    {generation.status === "failed" ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-red-600 font-medium">
                          Generation failed
                        </span>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                        <span className="text-neutral-600">
                          {generation.status === "generating"
                            ? "Generating..."
                            : "In queue..."}
                        </span>
                      </>
                    )}
                  </div>
                  {generation.error && (
                    <p className="text-sm text-red-500 mt-2">
                      {generation.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
