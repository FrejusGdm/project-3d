"use client";

import { motion } from "framer-motion";

// Cyan palette
const CYAN_PALETTE = [
  "#06b6d4",
  "#0891b2",
  "#22d3ee",
  "#67e8f9",
  "#155e75",
  "#0e7490",
  "#a5f3fc",
];

const GRID_SIZE = 6;
const BLOCK_SIZE = 50;
const GAP = 8;

export function WaveBlocks() {
  const blocks = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
    id: i,
    row: Math.floor(i / GRID_SIZE),
    col: i % GRID_SIZE,
    color: CYAN_PALETTE[i % CYAN_PALETTE.length],
  }));

  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-50/50">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${BLOCK_SIZE}px)`,
          gap: GAP,
        }}
      >
        {blocks.map((block) => (
          <motion.div
            key={block.id}
            className="rounded-lg border border-black/10"
            style={{
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              backgroundColor: block.color,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: (block.row + block.col) * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
