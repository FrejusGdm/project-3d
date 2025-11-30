"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import Image from "next/image";

interface ModelPreviewProps {
  plyUrl: string | null; // Now actually a GLB URL
  thumbnailUrl?: string | null;
  isHovered?: boolean;
}

function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  // Slow rotation
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  // Clone the scene to avoid issues with reusing
  const clonedScene = scene.clone();

  return (
    <Center>
      <group ref={groupRef} scale={2}>
        <primitive object={clonedScene} />
      </group>
    </Center>
  );
}

function LoadingPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#e5e5e5" wireframe />
    </mesh>
  );
}

export function ModelPreview({
  plyUrl,
  thumbnailUrl,
  isHovered = false,
}: ModelPreviewProps) {
  const [hasError] = useState(false);

  // Only load 3D model on hover for performance
  const shouldShow3D = isHovered && plyUrl && !hasError;

  return (
    <div className="relative w-full h-full bg-neutral-50 rounded-xl overflow-hidden">
      {/* Static thumbnail when not hovered */}
      {thumbnailUrl && !shouldShow3D && (
        <Image
          src={thumbnailUrl}
          alt="Model preview"
          fill
          className="object-cover"
        />
      )}

      {/* Placeholder when no thumbnail */}
      {!thumbnailUrl && !shouldShow3D && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
          <div className="w-16 h-16 rounded-xl bg-neutral-300/50" />
        </div>
      )}

      {/* 3D Canvas on hover */}
      {shouldShow3D && (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          className="absolute inset-0"
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Suspense fallback={<LoadingPlaceholder />}>
            <GLBModel url={plyUrl} />
          </Suspense>
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
          />
          <Environment preset="studio" />
        </Canvas>
      )}

      {/* Hover indicator */}
      {plyUrl && !isHovered && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-md backdrop-blur-sm">
          Hover for 3D
        </div>
      )}
    </div>
  );
}
