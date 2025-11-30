"use client";

import { useState } from "react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { LikeButton } from "./LikeButton";
import dynamic from "next/dynamic";

// Dynamic import for 3D preview to avoid SSR issues
const ModelPreview = dynamic(
  () => import("./ModelPreview").then((mod) => mod.ModelPreview),
  { ssr: false }
);

interface GalleryCardProps {
  id: Id<"generations">;
  prompt: string;
  outputUrl: string | null;
  thumbnailUrl: string | null;
  likesCount: number;
  isLiked: boolean;
  createdAt: number;
}

export function GalleryCard({
  id,
  prompt,
  outputUrl,
  thumbnailUrl,
  likesCount,
  isLiked,
  createdAt,
}: GalleryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/generation/${id}`}>
      <div
        className="group relative bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-lg transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Preview Area */}
        <div className="aspect-square">
          <ModelPreview
            plyUrl={outputUrl}
            thumbnailUrl={thumbnailUrl}
            isHovered={isHovered}
          />
        </div>

        {/* Info Footer */}
        <div className="p-4 space-y-2">
          <p className="text-sm text-neutral-800 line-clamp-2 font-medium">
            {prompt}
          </p>
          <div className="flex items-center justify-between">
            <LikeButton
              generationId={id}
              initialLikesCount={likesCount}
              initialLiked={isLiked}
            />
            <span className="text-xs text-neutral-400">
              {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
