"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { MinimalHeader } from "@/components/MinimalHeader";
import { Sidebar } from "@/components/Sidebar";
import { GalleryCard } from "@/components/gallery/GalleryCard";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";

export default function MyGenerationsPage() {
  const { user, isLoaded } = useUser();

  const generationsData = useQuery(
    api.generations.listByUser,
    user ? { userId: user.id } : "skip"
  );

  const userLikedIds = useQuery(
    api.likes.getUserLikedIds,
    user ? { userId: user.id } : "skip"
  );

  if (!isLoaded) {
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

  const likedSet = new Set(userLikedIds || []);

  return (
    <main className="min-h-screen bg-white text-black">
      <MinimalHeader />
      <Sidebar />

      <div className="pt-[65px] md:pl-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif italic font-bold tracking-tight">
                My Generations
              </h1>
              <p className="text-neutral-500 mt-1">
                All your AI-generated keycap designs
              </p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              Create New
            </Link>
          </div>

          {/* Content */}
          {generationsData === undefined ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : generationsData.generations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 mb-6 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <span className="text-3xl">🎨</span>
              </div>
              <h3 className="text-xl font-medium text-neutral-800 mb-2">
                No generations yet
              </h3>
              <p className="text-neutral-500 mb-6 max-w-md">
                Start creating your first AI-generated keycap design. Each
                prompt generates 4 unique variations!
              </p>
              <Link
                href="/"
                className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Create Your First Design
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {generationsData.generations.map((gen) => (
                <GalleryCard
                  key={gen._id}
                  id={gen._id}
                  prompt={gen.prompt}
                  outputUrl={gen.outputUrl}
                  thumbnailUrl={gen.thumbnailUrl}
                  likesCount={gen.likesCount}
                  isLiked={likedSet.has(gen._id)}
                  createdAt={gen.createdAt}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
