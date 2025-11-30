"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GalleryCard } from "./GalleryCard";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

interface GalleryGridProps {
  limit?: number;
}

export function GalleryGrid({ limit = 20 }: GalleryGridProps) {
  const { user } = useUser();
  const galleryData = useQuery(api.gallery.list, { limit });
  const userLikedIds = useQuery(
    api.likes.getUserLikedIds,
    user ? { userId: user.id } : "skip"
  );

  if (galleryData === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (galleryData.generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
          <span className="text-2xl">🎨</span>
        </div>
        <h3 className="text-lg font-medium text-neutral-800 mb-2">
          No creations yet
        </h3>
        <p className="text-sm text-neutral-500">
          Be the first to create something amazing!
        </p>
      </div>
    );
  }

  const likedSet = new Set(userLikedIds || []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {galleryData.generations.map((gen) => (
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
  );
}
