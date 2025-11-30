"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Center } from "@react-three/drei";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

interface ModelPreviewProps {
  plyUrl: string | null;
  thumbnailUrl?: string | null;
  isHovered?: boolean;
}

function PLYModel({ url }: { url: string }) {
  const geometry = useLoader(PLYLoader, url);
  const meshRef = useRef<THREE.Mesh>(null);

  // Slow rotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  // Compute normals if needed for proper lighting
  if (geometry.attributes.position && !geometry.attributes.normal) {
    geometry.computeVertexNormals();
  }

  return (
    <Center>
      <mesh ref={meshRef} geometry={geometry} scale={2}>
        <meshStandardMaterial
          vertexColors={!!geometry.attributes.color}
          color={geometry.attributes.color ? undefined : "#888888"}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
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
  const [showModel, setShowModel] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Only load 3D model on hover for performance
  const shouldShow3D = isHovered && plyUrl && !hasError;

  return (
    <div className="relative w-full h-full bg-neutral-50 rounded-xl overflow-hidden">
      {/* Static thumbnail when not hovered */}
      {thumbnailUrl && !shouldShow3D && (
        <img
          src={thumbnailUrl}
          alt="Model preview"
          className="w-full h-full object-cover"
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
            <PLYModel url={plyUrl} />
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
