"use client";

import { Heart } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../backend-project-3d/convex/_generated/api";
import { Id } from "../../../backend-project-3d/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useState, useOptimistic } from "react";

interface LikeButtonProps {
  generationId: Id<"generations">;
  initialLikesCount: number;
  initialLiked: boolean;
}

export function LikeButton({
  generationId,
  initialLikesCount,
  initialLiked,
}: LikeButtonProps) {
  const { user, isSignedIn } = useUser();
  const toggleLike = useMutation(api.likes.toggle);

  const [optimisticState, setOptimisticState] = useOptimistic(
    { liked: initialLiked, count: initialLikesCount },
    (state, newLiked: boolean) => ({
      liked: newLiked,
      count: newLiked ? state.count + 1 : state.count - 1,
    })
  );

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn || !user) return;

    // Optimistic update
    setOptimisticState(!optimisticState.liked);

    try {
      await toggleLike({
        userId: user.id,
        generationId,
      });
    } catch (error) {
      // Revert on error
      setOptimisticState(optimisticState.liked);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isSignedIn}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all text-sm",
        optimisticState.liked
          ? "text-red-500"
          : "text-neutral-500 hover:text-red-400",
        !isSignedIn && "opacity-50 cursor-not-allowed"
      )}
    >
      <Heart
        size={16}
        className={cn(
          "transition-transform",
          optimisticState.liked && "fill-current scale-110"
        )}
      />
      <span className="font-medium">{optimisticState.count}</span>
    </button>
  );
}
