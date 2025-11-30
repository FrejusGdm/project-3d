"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

interface MinimalHeaderProps {
  onLogoClick?: () => void;
}

export function MinimalHeader({ onLogoClick }: MinimalHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-8 bg-white/80 backdrop-blur-sm border-b border-neutral-100/50">
      <div onClick={onLogoClick} className="cursor-pointer">
        {onLogoClick ? (
          <span className="text-2xl font-serif italic font-bold tracking-tighter text-black">
            Forge
          </span>
        ) : (
          <Link
            href="/"
            className="text-2xl font-serif italic font-bold tracking-tighter text-black"
          >
            Forge
          </Link>
        )}
      </div>

      <nav className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-9 h-9",
              },
            }}
          />
        </SignedIn>
      </nav>
    </header>
  );
}
