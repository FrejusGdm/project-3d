"use client";

import { useRef, useEffect, useCallback } from "react";

interface StaggerBlockLoaderProps {
  size?: number;
  className?: string;
}

interface BlockData {
  x: number;
  y: number;
  w: number;
  h: number;
  gx: number;
  gy: number;
  gw: number;
  gh: number;
}

interface BlockElement extends HTMLDivElement {
  data: BlockData;
}

const GRID = 5;
const RIM = 3;
const MAIN_COLOR = "#000000";
const BG_COLOR = "#f5f5f5";

const EASE = {
  dur: 450,
  wait: 0,
  getKeyframes: (startY: number) => [
    { transform: `translateY(${startY}px)`, opacity: 0, offset: 0 },
    { transform: `translateY(${startY * 0.5}px)`, opacity: 0.6, offset: 0.35 },
    { transform: `translateY(${startY * 0.15}px)`, opacity: 0.9, offset: 0.65 },
    { transform: `translateY(${startY * 0.03}px)`, opacity: 1, offset: 0.88 },
    { transform: "translateY(0)", opacity: 1, offset: 1 },
  ],
  easing: "cubic-bezier(0.1, 0, 0.2, 1)",
};

const SHAPES: [number, number][] = [
  [1, 1],
  [2, 1],
  [3, 1],
  [1, 2],
  [1, 3],
  [2, 2],
  [2, 3],
  [3, 2],
];

export function StaggerBlockLoader({
  size = 150,
  className = "",
}: StaggerBlockLoaderProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<BlockElement[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const idxRef = useRef(0);
  const isRunningRef = useRef(false);

  const cellSize = size / GRID;

  const makeLayout = useCallback((): BlockData[] => {
    const grid: boolean[][] = [];
    for (let y = 0; y < GRID; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID; x++) {
        grid[y][x] = false;
      }
    }

    const out: BlockData[] = [];

    function canPlace(x: number, y: number, w: number, h: number): boolean {
      if (x < 0 || y < 0 || x + w > GRID || y + h > GRID) return false;
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          if (grid[y + dy][x + dx]) return false;
        }
      }
      return true;
    }

    function place(x: number, y: number, w: number, h: number) {
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          grid[y + dy][x + dx] = true;
        }
      }
      out.push({
        x: x * cellSize,
        y: y * cellSize,
        w: w * cellSize,
        h: h * cellSize,
        gx: x,
        gy: y,
        gw: w,
        gh: h,
      });
    }

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (grid[y][x]) continue;
        const shuffled = [...SHAPES].sort(() => Math.random() - 0.5);
        let placed = false;
        for (const [w, h] of shuffled) {
          if (canPlace(x, y, w, h)) {
            place(x, y, w, h);
            placed = true;
            break;
          }
        }
        if (!placed && canPlace(x, y, 1, 1)) place(x, y, 1, 1);
      }
    }

    return out.sort((a, b) => {
      const bottomA = a.y + a.h;
      const bottomB = b.y + b.h;
      if (bottomA !== bottomB) return bottomB - bottomA;
      return a.x - b.x;
    });
  }, [cellSize]);

  const makeBlock = useCallback((data: BlockData): BlockElement => {
    const el = document.createElement("div") as BlockElement;
    el.className = "block";
    el.style.position = "absolute";
    el.style.willChange = "transform, opacity";
    el.style.pointerEvents = "none";
    el.style.left = data.x + "px";
    el.style.top = data.y + "px";
    el.style.width = data.w + "px";
    el.style.height = data.h + "px";

    const pulseDelay = (Math.random() * 2).toFixed(2);
    const pulseDur = (2.5 + Math.random() * 1.5).toFixed(2);
    el.style.setProperty("--pulse-delay", pulseDelay + "s");
    el.style.setProperty("--pulse-dur", pulseDur + "s");
    el.style.opacity = "0";

    const face = document.createElement("div");
    face.style.width = "100%";
    face.style.height = "100%";
    face.style.position = "relative";
    face.style.overflow = "hidden";
    face.style.border = RIM + "px solid " + MAIN_COLOR;
    face.style.background = BG_COLOR;
    face.style.borderRadius = "6px";

    if (data.gw > 1 || data.gh > 1) {
      const innerGrid = document.createElement("div");
      innerGrid.style.position = "absolute";
      innerGrid.style.top = "0";
      innerGrid.style.left = "0";
      innerGrid.style.right = "0";
      innerGrid.style.bottom = "0";
      innerGrid.style.display = "grid";
      innerGrid.style.gridTemplateColumns = `repeat(${data.gw}, 1fr)`;
      innerGrid.style.gridTemplateRows = `repeat(${data.gh}, 1fr)`;
      innerGrid.style.gap = RIM + "px";
      innerGrid.style.background = MAIN_COLOR;
      innerGrid.style.borderRadius = "3px";

      for (let cy = 0; cy < data.gh; cy++) {
        for (let cx = 0; cx < data.gw; cx++) {
          const cell = document.createElement("div");
          cell.style.boxSizing = "border-box";
          cell.style.background = BG_COLOR;
          cell.style.borderRadius = "3px";
          innerGrid.appendChild(cell);
        }
      }
      face.appendChild(innerGrid);
    }

    el.appendChild(face);
    el.data = data;
    return el;
  }, []);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isRunningRef.current = false;
    blocksRef.current.forEach((b) =>
      b.getAnimations().forEach((a) => a.cancel())
    );
    if (stageRef.current) {
      stageRef.current.innerHTML = "";
    }
    blocksRef.current = [];
    idxRef.current = 0;
  }, []);

  const glowAndDisappear = useCallback(() => {
    blocksRef.current.forEach((b) => {
      b.style.transition = "filter 0.2s ease, opacity 0.3s ease";
      b.style.filter =
        "brightness(1.4) drop-shadow(0 0 8px rgba(0, 0, 0, 0.3))";
    });

    setTimeout(() => {
      blocksRef.current.forEach((b) => {
        b.style.filter = "brightness(1)";
        b.style.opacity = "0";
      });
    }, 200);

    setTimeout(() => {
      if (isRunningRef.current) {
        run();
      }
    }, 350);
  }, []);

  const next = useCallback(() => {
    if (!isRunningRef.current) return;
    if (idxRef.current >= blocksRef.current.length) {
      glowAndDisappear();
      return;
    }

    const el = blocksRef.current[idxRef.current];
    const d = el.data;
    const startY = -(d.y + d.h + 80);

    const animation = el.animate(EASE.getKeyframes(startY), {
      duration: EASE.dur,
      easing: EASE.easing,
      fill: "none",
    });

    animation.onfinish = () => {
      if (!isRunningRef.current) return;
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      el.classList.add("done");
      idxRef.current++;
      timerRef.current = setTimeout(next, EASE.wait);
    };
  }, [glowAndDisappear]);

  const run = useCallback(() => {
    clear();
    isRunningRef.current = true;
    const layout = makeLayout();
    layout.forEach((d) => {
      const el = makeBlock(d);
      if (stageRef.current) {
        stageRef.current.appendChild(el);
      }
      blocksRef.current.push(el);
    });
    timerRef.current = setTimeout(next, 500);
  }, [clear, makeLayout, makeBlock, next]);

  useEffect(() => {
    run();
    return () => {
      clear();
    };
  }, [run, clear]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <style jsx global>{`
        @keyframes idle {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(0) scale(1.012);
          }
        }
        .block.done {
          animation: idle var(--pulse-dur) ease-in-out infinite;
          animation-delay: var(--pulse-delay);
        }
      `}</style>
      <div
        ref={stageRef}
        className="relative overflow-visible"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
