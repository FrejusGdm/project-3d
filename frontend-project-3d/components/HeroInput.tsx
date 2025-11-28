"use client";

import { ArrowRight } from 'lucide-react';
import { useState, FormEvent } from 'react';

interface HeroInputProps {
  placeholder?: string;
  onSubmit?: (value: string) => void;
}

export function HeroInput({ placeholder = "Describe your vibe...", onSubmit }: HeroInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (value.trim() && onSubmit) {
      onSubmit(value);
      setValue(""); // Clear after submit if needed, or keep it based on preference
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`
        relative w-full max-w-2xl transition-all duration-300 ease-out
        ${isFocused ? 'scale-[1.02]' : 'scale-100'}
      `}
    >
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="
            w-full px-6 py-5 text-lg md:text-xl 
            bg-white 
            border-2 border-neutral-200 
            text-black
            rounded-2xl shadow-sm outline-none
            placeholder:text-neutral-400
            focus:border-black
            transition-all duration-300
          "
        />
        
        <button 
          type="submit"
          className={`
            absolute right-3 top-1/2 -translate-y-1/2
            p-2 rounded-xl bg-black dark:bg-white text-white dark:text-black
            transition-all duration-300
            ${value ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}
          `}
        >
          <ArrowRight size={20} />
        </button>
      </div>
      
      {/* Decorative subtle glow/shadow on focus */}
      <div 
        className={`
          absolute inset-0 -z-10 bg-black/5 dark:bg-white/5 blur-xl rounded-3xl
          transition-opacity duration-500
          ${isFocused ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </form>
  );
}
