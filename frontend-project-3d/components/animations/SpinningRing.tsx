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

function RingOfCubes() {
  const groupRef = useRef<THREE.Group>(null);
  const cubeCount = 12;
  const radius = 2.5;

  const cubes = useMemo(() => {
    return Array.from({ length: cubeCount }, (_, i) => {
      const angle = (i / cubeCount) * Math.PI * 2;
      return {
        id: i,
        position: [
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0,
        ] as [number, number, number],
        color: CYAN_PALETTE[i % CYAN_PALETTE.length],
      };
    });
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = clock.elapsedTime * 0.3;
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {cubes.map((cube) => (
        <mesh key={cube.id} position={cube.position}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={cube.color} />
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(0.5, 0.5, 0.5)]} />
            <lineBasicMaterial color="black" opacity={0.2} transparent />
          </lineSegments>
        </mesh>
      ))}
    </group>
  );
}

export function SpinningRing() {
  return (
    <div className="w-full h-full bg-neutral-50/50">
      <Canvas camera={{ position: [0, 0, 8], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <RingOfCubes />
      </Canvas>
    </div>
  );
}
