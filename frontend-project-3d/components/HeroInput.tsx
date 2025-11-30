"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState, FormEvent, useRef } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";

interface HeroInputProps {
  placeholder?: string;
  onSubmit?: (value: string) => void;
  isLoading?: boolean;
}

export function HeroInput({
  placeholder = "Describe your vibe...",
  onSubmit,
  isLoading = false,
}: HeroInputProps) {
  const { isSignedIn } = useUser();
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!isSignedIn) {
      return;
    }
    if (value.trim() && onSubmit && !isLoading) {
      onSubmit(value);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const inputContent = (
    <div className="relative group">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={isLoading}
        className={`
          w-full px-6 py-5 text-lg md:text-xl
          bg-white
          border-2 border-neutral-200
          text-black
          rounded-2xl shadow-sm outline-none
          placeholder:text-neutral-400
          focus:border-black
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          ${!isSignedIn ? "pointer-events-none" : ""}
        `}
      />

      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className={`
          absolute right-3 top-1/2 -translate-y-1/2
          p-2 rounded-xl bg-black text-white
          transition-all duration-300
          disabled:opacity-50
          ${value ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"}
        `}
      >
        {isLoading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <ArrowRight size={20} />
        )}
      </button>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        relative w-full max-w-2xl transition-all duration-300 ease-out
        ${isFocused ? "scale-[1.02]" : "scale-100"}
      `}
    >
      {isSignedIn ? (
        inputContent
      ) : (
        <SignInButton mode="modal">
          <div onClick={(e) => e.stopPropagation()} className="w-full">
            {inputContent}
          </div>
        </SignInButton>
      )}

      {/* Decorative subtle glow/shadow on focus */}
      <div
        className={`
          absolute inset-0 -z-10 bg-black/5 blur-xl rounded-3xl
          transition-opacity duration-500
          ${isFocused ? "opacity-100" : "opacity-0"}
        `}
      />
    </form>
  );
}
