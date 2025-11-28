"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Palette similar to before but maybe slightly more "toy-like"
const COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEEAD", // Yellow
  "#D4A5A5", // Pink
  "#9B59B6", // Purple
];

interface BlockData {
  id: string;
  x: number;
  z: number;
  targetY: number;
  color: string;
  spawnY: number;
}

function FallingBlock({ data }: { data: BlockData }) {
  const mesh = useRef<THREE.Mesh>(null);
  const [landed, setLanded] = useState(false);
  
  // Speed of falling
  const SPEED = 8; 

  useFrame((state, delta) => {
    if (!mesh.current) return;
    
    if (!landed) {
      // Move down
      mesh.current.position.y -= SPEED * delta;
      
      // Check if hit target
      if (mesh.current.position.y <= data.targetY) {
        mesh.current.position.y = data.targetY;
        setLanded(true);
        
        // Add a little "squash" or "bounce" effect here if we wanted
      }
    }
  });

  return (
    <mesh ref={mesh} position={[data.x, data.spawnY, data.z]}>
      <boxGeometry args={[0.45, 0.45, 0.45]} />
      <meshStandardMaterial color={data.color} />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.45, 0.45, 0.45)]} />
        <lineBasicMaterial color="black" opacity={0.1} transparent />
      </lineSegments>
    </mesh>
  );
}

export function FallingTetrisLoader() {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  // Grid state: 5x5 grid, storing current height
  // range x: -2 to 2, z: -2 to 2
  const gridSize = 5;
  const offset = Math.floor(gridSize / 2);
  const heights = useRef<number[][]>(
    Array(gridSize).fill(0).map(() => Array(gridSize).fill(0))
  );
  
  // Timer for spawning
  useEffect(() => {
    const interval = setInterval(() => {
      setBlocks((current) => {
        // 1. Check if grid is effectively full (simple heuristic: max blocks)
        if (current.length > 60) { // approx 2-3 layers average
           // Reset!
           heights.current = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
           return [];
        }

        // 2. Pick random column
        const gridX = Math.floor(Math.random() * gridSize);
        const gridZ = Math.floor(Math.random() * gridSize);
        
        // 3. Calculate world positions
        // block size ~0.5
        const spacing = 0.5;
        const worldX = (gridX - offset) * spacing;
        const worldZ = (gridZ - offset) * spacing;
        
        // 4. Calculate target Y
        // Base is at y = -1 (ish)
        const baseHeight = -1.5; 
        const currentStackHeight = heights.current[gridX][gridZ];
        const targetY = baseHeight + (currentStackHeight * spacing) + (spacing/2);
        
        // Update grid height
        heights.current[gridX][gridZ] += 1;

        // 5. Create new block
        const newBlock: BlockData = {
          id: Math.random().toString(36).substr(2, 9),
          x: worldX,
          z: worldZ,
          targetY: targetY,
          spawnY: 4, // Spawn high up
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };

        return [...current, newBlock];
      });
    }, 100); // Spawn every 100ms

    return () => clearInterval(interval);
  }, []);

  return (
    <group>
      {/* Base Platform */}
      <mesh position={[0, -2, 0]} receiveShadow>
        <boxGeometry args={[3, 0.2, 3]} />
        <meshStandardMaterial color="#e5e5e5" />
      </mesh>

      {/* Blocks */}
      {blocks.map((block) => (
        <FallingBlock key={block.id} data={block} />
      ))}
    </group>
  );
}

