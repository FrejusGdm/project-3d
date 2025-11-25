"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CYAN_PALETTE = [
  "#06b6d4",
  "#0891b2",
  "#22d3ee",
  "#67e8f9",
  "#155e75",
  "#0e7490",
  "#a5f3fc",
];

interface Block {
  id: string;
  color: string;
  row: number;
}

const BLOCK_HEIGHT = 30;
const BLOCK_WIDTH = 200;

export function StackingBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlocks((prev) => {
        // Reset when stack is too high
        if (prev.length > 15) {
          return [];
        }

        const newBlock: Block = {
          id: Math.random().toString(36).substr(2, 9),
          color: CYAN_PALETTE[Math.floor(Math.random() * CYAN_PALETTE.length)],
          row: prev.length,
        };

        return [...prev, newBlock];
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-end justify-center pb-12 overflow-hidden bg-neutral-50/50">
      <div className="relative" style={{ width: BLOCK_WIDTH }}>
        <AnimatePresence>
          {blocks.map((block, index) => (
            <motion.div
              key={block.id}
              initial={{
                y: -400,
                rotate: Math.random() * 10 - 5,
                opacity: 0,
              }}
              animate={{
                y: -index * (BLOCK_HEIGHT + 4),
                rotate: 0,
                opacity: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                y: 100,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              className="absolute bottom-0 left-0 rounded-md border border-black/10"
              style={{
                width: BLOCK_WIDTH - (index % 3) * 10,
                height: BLOCK_HEIGHT,
                backgroundColor: block.color,
                marginLeft: (index % 3) * 5,
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
