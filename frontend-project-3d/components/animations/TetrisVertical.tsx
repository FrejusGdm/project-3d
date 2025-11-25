"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Cyan/Teal palette matching the 3D version
const CYAN_PALETTE = [
  "#06b6d4", // Cyan 500
  "#0891b2", // Cyan 600
  "#22d3ee", // Cyan 400
  "#67e8f9", // Cyan 300
  "#155e75", // Cyan 800
  "#0e7490", // Cyan 700
  "#a5f3fc", // Cyan 200
];

// Tetris-like shapes (relative cell positions)
const TETRIS_SHAPES = [
  // I-piece (horizontal)
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], width: 4, height: 1 },
  // I-piece (vertical)
  { cells: [[0, 0], [0, 1], [0, 2], [0, 3]], width: 1, height: 4 },
  // O-piece (square)
  { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], width: 2, height: 2 },
  // T-piece
  { cells: [[0, 0], [1, 0], [2, 0], [1, 1]], width: 3, height: 2 },
  // L-piece
  { cells: [[0, 0], [0, 1], [0, 2], [1, 2]], width: 2, height: 3 },
  // J-piece
  { cells: [[1, 0], [1, 1], [1, 2], [0, 2]], width: 2, height: 3 },
  // S-piece
  { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], width: 3, height: 2 },
  // Z-piece
  { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], width: 3, height: 2 },
  // Single block
  { cells: [[0, 0]], width: 1, height: 1 },
  // Small L
  { cells: [[0, 0], [0, 1], [1, 1]], width: 2, height: 2 },
];

interface FallingPiece {
  id: string;
  shape: typeof TETRIS_SHAPES[0];
  x: number; // Starting column
  color: string;
  delay: number;
}

const GRID_COLS = 10;
const CELL_SIZE = 28; // px
const GAP = 3; // px

export function TetrisVertical() {
  const [pieces, setPieces] = useState<FallingPiece[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPieces((prev) => {
        // Reset when too many pieces
        if (prev.length > 25) {
          return [];
        }

        // Pick random shape
        const shape = TETRIS_SHAPES[Math.floor(Math.random() * TETRIS_SHAPES.length)];

        // Pick random starting column (ensure it fits)
        const maxCol = GRID_COLS - shape.width;
        const col = Math.floor(Math.random() * (maxCol + 1));

        const newPiece: FallingPiece = {
          id: Math.random().toString(36).substr(2, 9),
          shape,
          x: col,
          color: CYAN_PALETTE[Math.floor(Math.random() * CYAN_PALETTE.length)],
          delay: Math.random() * 0.3,
        };

        return [...prev, newPiece];
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const gridWidth = GRID_COLS * (CELL_SIZE + GAP);

  return (
    <div className="w-full h-full relative overflow-hidden bg-neutral-50/50">
      <div
        className="absolute inset-0 flex justify-center"
        style={{ width: "100%" }}
      >
        <div className="relative" style={{ width: gridWidth }}>
          <AnimatePresence>
            {pieces.map((piece) => (
              <motion.div
                key={piece.id}
                initial={{ top: -150, opacity: 1 }}
                animate={{ top: "100%" }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 3 + Math.random() * 1.5,
                  delay: piece.delay,
                  ease: "linear",
                }}
                className="absolute"
                style={{
                  left: piece.x * (CELL_SIZE + GAP),
                }}
              >
                {/* Render each cell of the tetris piece */}
                {piece.shape.cells.map(([cx, cy], i) => (
                  <div
                    key={i}
                    className="absolute rounded-sm border border-black/10"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: piece.color,
                      left: cx * (CELL_SIZE + GAP),
                      top: cy * (CELL_SIZE + GAP),
                      boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.1)",
                    }}
                  />
                ))}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
