"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

const CYAN_PALETTE = [
  "#06b6d4",
  "#0891b2",
  "#22d3ee",
  "#67e8f9",
  "#155e75",
  "#0e7490",
  "#a5f3fc",
];

function FloatingCube({ position, color, speed }: {
  position: [number, number, number];
  color: string;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = initialY + Math.sin(clock.elapsedTime * speed) * 0.5;
      meshRef.current.rotation.x = clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = clock.elapsedTime * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color={color} />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.6, 0.6, 0.6)]} />
        <lineBasicMaterial color="black" opacity={0.2} transparent />
      </lineSegments>
    </mesh>
  );
}

function CubeField() {
  const cubes = useMemo(() => {
    const items = [];
    for (let x = -2; x <= 2; x++) {
      for (let y = -1; y <= 1; y++) {
        items.push({
          id: `${x}-${y}`,
          position: [x * 1.2, y * 1.2, 0] as [number, number, number],
          color: CYAN_PALETTE[Math.floor(Math.random() * CYAN_PALETTE.length)],
          speed: 0.5 + Math.random() * 1,
        });
      }
    }
    return items;
  }, []);

  return (
    <>
      {cubes.map((cube) => (
        <FloatingCube
          key={cube.id}
          position={cube.position}
          color={cube.color}
          speed={cube.speed}
        />
      ))}
    </>
  );
}

export function FloatingCubes() {
  return (
    <div className="w-full h-full bg-neutral-50/50">
      <Canvas camera={{ position: [0, 0, 8], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <CubeField />
      </Canvas>
    </div>
  );
}
