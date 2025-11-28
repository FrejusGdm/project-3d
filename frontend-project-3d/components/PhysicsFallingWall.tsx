"use client";

import { useEffect, useState } from "react";
import { Physics, useBox, usePlane } from "@react-three/cannon";
import * as THREE from "three";

// Cyan/Teal heavy palette
const CYAN_PALETTE = [
  "#06b6d4", // Cyan 500
  "#0891b2", // Cyan 600
  "#22d3ee", // Cyan 400
  "#67e8f9", // Cyan 300
  "#155e75", // Cyan 800
  "#0e7490", // Cyan 700
  "#a5f3fc", // Cyan 200
];

// A single physics block
function PhysicsBlock({ position, color }: { position: [number, number, number], color: string }) {
  const [ref] = useBox(() => ({
    mass: 1,
    position,
    args: [0.5, 0.5, 0.5],
    friction: 0.5,
    restitution: 0.2, // Bounciness
  }));

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={color} />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.5, 0.5, 0.5)]} />
        <lineBasicMaterial color="black" opacity={0.1} transparent />
      </lineSegments>
    </mesh>
  );
}

// The floor that catches them
function Floor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -3, 0],
  }));
  
  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#f5f5f5" transparent opacity={0.5} />
    </mesh>
  );
}

// Invisible walls to contain the "spill" initially but let it overflow
function ContainerWalls() {
    // Left wall
    useBox(() => ({ position: [-2.5, 0, 0], args: [0.5, 10, 5], isStatic: true }));
    // Right wall
    useBox(() => ({ position: [2.5, 0, 0], args: [0.5, 10, 5], isStatic: true }));
    // Back wall
    useBox(() => ({ position: [0, 0, -2.5], args: [5, 10, 0.5], isStatic: true }));
    // Front wall (glass?)
    useBox(() => ({ position: [0, 0, 2.5], args: [5, 10, 0.5], isStatic: true }));
    
    return null;
}

function BlockSpawner() {
  const [blocks, setBlocks] = useState<{ id: string, pos: [number, number, number], color: string }[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBlocks(prev => {
        // Spill over logic: clear if too many
        if (prev.length > 80) { 
            return [];
        }
        
        const newBlock = {
            id: Math.random().toString(36).substr(2, 9),
            // Spawn in a line/wall shape at the top
            pos: [(Math.random() - 0.5) * 4, 6 + Math.random() * 2, (Math.random() - 0.5) * 1] as [number, number, number],
            color: CYAN_PALETTE[Math.floor(Math.random() * CYAN_PALETTE.length)]
        };
        return [...prev, newBlock];
      });
    }, 100); // Fast spawn rate
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {blocks.map(b => (
        <PhysicsBlock key={b.id} position={b.pos} color={b.color} />
      ))}
    </>
  );
}

// IMPORTANT: Physics must be inside Canvas, so this component handles the Physics wrapper
// BUT the actual Canvas is in Scene3D. We should export the CONTENT here.
export function PhysicsContent() {
  return (
    <Physics gravity={[0, -15, 0]}>
      <Floor />
      <ContainerWalls />
      <BlockSpawner />
    </Physics>
  );
}
