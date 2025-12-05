"use client";

import { TetrisVertical } from "../animations/TetrisVertical";

export function TetrisLoader() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-64 h-64 relative overflow-hidden rounded-xl border border-neutral-200 bg-white/50 shadow-inner">
        <div className="absolute inset-0 transform scale-75 origin-bottom">
          <TetrisVertical />
        </div>
      </div>
      <div className="mt-6 text-center space-y-1">
        <p className="font-medium text-neutral-800">Generating Model...</p>
        <p className="text-sm text-neutral-500">This usually takes about 1-2 minutes</p>
      </div>
    </div>
  );
}
