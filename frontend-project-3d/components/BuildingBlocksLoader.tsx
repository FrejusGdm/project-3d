"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COLORS = [
  "#FF6B6B", // Pastel Red
  "#4ECDC4", // Teal
  "#45B7D1", // Sky Blue
  "#96CEB4", // Pale Green
  "#FFEEAD", // Cream Yellow
  "#D4A5A5", // Dusky Pink
  "#9B59B6", // Amethyst
  "#3498DB", // Blue
];

function AnimatedBlock({ position, color, offset }: { position: [number, number, number], color: string, offset: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (mesh.current) {
      const time = state.clock.elapsedTime;
      // Satisfying wave scale effect
      const scale = 0.8 + Math.sin(time * 2 + offset) * 0.2;
      mesh.current.scale.set(scale, scale, scale);
      
      // Gentle breathing rotation
      mesh.current.rotation.x = Math.sin(time * 0.5 + offset) * 0.1;
      mesh.current.rotation.y = Math.cos(time * 0.5 + offset) * 0.1;
    }
  });

  return (
    <mesh ref={mesh} position={position}>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial color={color} roughness={0.3} />
    </mesh>
  );
}

export function BuildingBlocksLoader() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      // Slow overall rotation for the whole assembly
      group.current.rotation.y = state.clock.elapsedTime * 0.2;
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  // Generate a 3x3x3 grid of blocks centered at 0,0,0
  const blocks = [];
  let i = 0;
  const size = 1; // Grid size (3x3x3)
  const spacing = 0.5; // Distance between block centers

  for (let x = -size; x <= size; x++) {
    for (let y = -size; y <= size; y++) {
      for (let z = -size; z <= size; z++) {
        // Calculate distance from center for wave offset
        const distance = Math.sqrt(x*x + y*y + z*z);
        const colorIndex = (Math.abs(x) + Math.abs(y) + Math.abs(z)) % COLORS.length;
        
        blocks.push({
          position: [x * spacing, y * spacing, z * spacing] as [number, number, number],
          color: COLORS[colorIndex],
          offset: distance, // Use distance for wave phase
          key: i++
        });
      }
    }
  }

  return (
    <group ref={group}>
      {blocks.map((block) => (
        <AnimatedBlock 
          key={block.key} 
          position={block.position} 
          color={block.color} 
          offset={block.offset} 
        />
      ))}
    </group>
  );
}
