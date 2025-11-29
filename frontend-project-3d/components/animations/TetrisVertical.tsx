"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Cyan/Teal palette
const CYAN_PALETTE = [
  "#06b6d4",
  "#0891b2",
  "#22d3ee",
  "#67e8f9",
  "#155e75",
  "#0e7490",
  "#a5f3fc",
];

// Tetris shapes - cells are [col, row] offsets from top-left
const TETRIS_SHAPES = [
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], width: 4, height: 1 }, // I horizontal
  { cells: [[0, 0], [0, 1], [0, 2], [0, 3]], width: 1, height: 4 }, // I vertical
  { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], width: 2, height: 2 }, // O square
  { cells: [[0, 0], [1, 0], [2, 0], [1, 1]], width: 3, height: 2 }, // T
  { cells: [[0, 0], [0, 1], [0, 2], [1, 2]], width: 2, height: 3 }, // L
  { cells: [[1, 0], [1, 1], [1, 2], [0, 2]], width: 2, height: 3 }, // J
  { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], width: 3, height: 2 }, // S
  { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], width: 3, height: 2 }, // Z
  { cells: [[0, 0]], width: 1, height: 1 }, // Single
];

interface StackedBlock {
  id: string;
  col: number;
  row: number;
  color: string;
}

interface FallingPiece {
  id: string;
  cells: number[][];
  col: number;
  color: string;
  targetRow: number;
}

const GRID_COLS = 12;
const GRID_ROWS = 16;
const CELL_SIZE = 24;
const GAP = 2;

export function TetrisVertical() {
  const [stackedBlocks, setStackedBlocks] = useState<StackedBlock[]>([]);
  const [fallingPiece, setFallingPiece] = useState<FallingPiece | null>(null);
  const columnHeightsRef = useRef<number[]>(Array(GRID_COLS).fill(0));

  // Calculate where a piece should land based on current stack
  const calculateLandingRow = useCallback((cells: number[][], startCol: number) => {
    let maxHeight = 0;

    cells.forEach(([cx]) => {
      const col = startCol + cx;
      if (col >= 0 && col < GRID_COLS) {
        maxHeight = Math.max(maxHeight, columnHeightsRef.current[col]);
      }
    });

    return maxHeight;
  }, []);

  // Spawn a new piece
  const spawnPiece = useCallback(() => {
    const shape = TETRIS_SHAPES[Math.floor(Math.random() * TETRIS_SHAPES.length)];
    const maxCol = GRID_COLS - shape.width;
    const col = Math.floor(Math.random() * (maxCol + 1));
    const color = CYAN_PALETTE[Math.floor(Math.random() * CYAN_PALETTE.length)];

    const targetRow = calculateLandingRow(shape.cells, col);

    // Check if stack is too high - reset
    if (targetRow + shape.height > GRID_ROWS - 2) {
      setStackedBlocks([]);
      columnHeightsRef.current = Array(GRID_COLS).fill(0);
      return;
    }

    setFallingPiece({
      id: Math.random().toString(36).substr(2, 9),
      cells: shape.cells,
      col,
      color,
      targetRow,
    });
  }, [calculateLandingRow]);

  // Handle piece landing
  const handlePieceLanded = useCallback(() => {
    if (!fallingPiece) return;

    const newBlocks: StackedBlock[] = [];

    fallingPiece.cells.forEach(([cx, cy]) => {
      const col = fallingPiece.col + cx;
      const row = fallingPiece.targetRow + cy;

      newBlocks.push({
        id: `${fallingPiece.id}-${cx}-${cy}`,
        col,
        row,
        color: fallingPiece.color,
      });

      // Update column height
      columnHeightsRef.current[col] = Math.max(
        columnHeightsRef.current[col],
        row + 1
      );
    });

    setStackedBlocks(prev => [...prev, ...newBlocks]);
    setFallingPiece(null);
  }, [fallingPiece]);

  // Spawn pieces periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!fallingPiece) {
        spawnPiece();
      }
    }, 150);

    return () => clearInterval(interval);
  }, [fallingPiece, spawnPiece]);

  const gridWidth = GRID_COLS * (CELL_SIZE + GAP);
  const gridHeight = GRID_ROWS * (CELL_SIZE + GAP);

  return (
    <div className="w-full h-full flex items-end justify-center overflow-hidden bg-neutral-50/50 pb-4">
      <div
        className="relative border-b-2 border-l border-r border-neutral-300/50 rounded-b-lg"
        style={{ width: gridWidth, height: gridHeight }}
      >
        {/* Stacked blocks */}
        {stackedBlocks.map((block) => (
          <motion.div
            key={block.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute rounded-sm border border-black/10"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: block.color,
              left: block.col * (CELL_SIZE + GAP),
              bottom: block.row * (CELL_SIZE + GAP),
              boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.1)",
            }}
          />
        ))}

        {/* Falling piece */}
        <AnimatePresence onExitComplete={handlePieceLanded}>
          {fallingPiece && (
            <motion.div
              key={fallingPiece.id}
              initial={{ bottom: gridHeight + 50 }}
              animate={{ bottom: fallingPiece.targetRow * (CELL_SIZE + GAP) }}
              exit={{ opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                mass: 0.8,
              }}
              onAnimationComplete={() => {
                handlePieceLanded();
              }}
              className="absolute"
              style={{ left: fallingPiece.col * (CELL_SIZE + GAP) }}
            >
              {fallingPiece.cells.map(([cx, cy], i) => (
                <div
                  key={i}
                  className="absolute rounded-sm border border-black/10"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: fallingPiece.color,
                    left: cx * (CELL_SIZE + GAP),
                    bottom: cy * (CELL_SIZE + GAP),
                    boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.1)",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ground indicator */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-neutral-300 to-transparent"
        />
      </div>
    </div>
  );
}
