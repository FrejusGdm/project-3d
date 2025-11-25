export { TetrisVertical } from "./TetrisVertical";
export { WaveBlocks } from "./WaveBlocks";
export { FloatingCubes } from "./FloatingCubes";
export { StackingBlocks } from "./StackingBlocks";
export { SpinningRing } from "./SpinningRing";

export type AnimationType =
  | "physics3d"      // Original 3D physics falling blocks
  | "tetrisVertical" // 2D Tetris-style stacking
  | "waveBlocks"     // 2D wave animation grid
  | "floatingCubes"  // 3D floating cubes
  | "stackingBlocks" // 2D vertical stacking
  | "spinningRing";  // 3D ring of spinning cubes

export const ANIMATION_OPTIONS: { value: AnimationType; label: string; description: string }[] = [
  { value: "physics3d", label: "3D Physics Blocks", description: "Original falling blocks with physics" },
  { value: "tetrisVertical", label: "2D Tetris", description: "Flat Tetris-style stacking" },
  { value: "waveBlocks", label: "2D Wave Grid", description: "Pulsing grid of blocks" },
  { value: "floatingCubes", label: "3D Floating", description: "Gently floating cubes" },
  { value: "stackingBlocks", label: "2D Stacking", description: "Simple vertical stack" },
  { value: "spinningRing", label: "3D Ring", description: "Rotating ring of cubes" },
];
