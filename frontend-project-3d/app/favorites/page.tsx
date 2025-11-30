"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { MinimalHeader } from "@/components/MinimalHeader";
import { Sidebar } from "@/components/Sidebar";
import { GalleryCard } from "@/components/gallery/GalleryCard";
import { Loader2, Heart } from "lucide-react";
import Link from "next/link";
import { api } from "../../../backend-project-3d/convex/_generated/api";

export default function FavoritesPage() {
  const { user, isLoaded } = useUser();

  const likedGenerations = useQuery(
    api.likes.getUserLikedGenerations,
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

  return (
    <main className="min-h-screen bg-white text-black">
      <MinimalHeader />
      <Sidebar />

      <div className="pt-[65px] md:pl-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif italic font-bold tracking-tight flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500 fill-current" />
              Favorites
            </h1>
            <p className="text-neutral-500 mt-1">
              Designs you've liked from the community
            </p>
          </div>

          {/* Content */}
          {likedGenerations === undefined ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : likedGenerations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 mb-6 rounded-2xl bg-red-50 flex items-center justify-center">
                <Heart className="w-10 h-10 text-red-300" />
              </div>
              <h3 className="text-xl font-medium text-neutral-800 mb-2">
                No favorites yet
              </h3>
              <p className="text-neutral-500 mb-6 max-w-md">
                Browse the community gallery and like designs you love. They'll
                appear here for easy access.
              </p>
              <Link
                href="/"
                className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Explore Gallery
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {likedGenerations.map(
                (gen) =>
                  gen && (
                    <GalleryCard
                      key={gen._id}
                      id={gen._id}
                      prompt={gen.prompt}
                      outputUrl={gen.outputUrl}
                      thumbnailUrl={gen.thumbnailUrl}
                      likesCount={gen.likesCount}
                      isLiked={true}
                      createdAt={gen.createdAt}
                    />
                  )
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
