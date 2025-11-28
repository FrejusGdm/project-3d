"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { Suspense, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PhysicsContent } from "./PhysicsFallingWall";
import {
  TetrisVertical,
  WaveBlocks,
  FloatingCubes,
  StackingBlocks,
  SpinningRing,
  ANIMATION_OPTIONS,
  type AnimationType,
} from "./animations";

function Cube() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="white" wireframe />
    </mesh>
  );
}

// 3D Physics animation (original)
function Physics3DAnimation() {
  return (
    <Canvas shadows camera={{ position: [0, 0, 12], fov: 35 }}>
      <Suspense fallback={null}>
        <Stage environment="city" intensity={0.6} adjustCamera={false}>
          <PhysicsContent />
        </Stage>
        <OrbitControls autoRotate enableZoom={false} />
      </Suspense>
    </Canvas>
  );
}

// Idle state with interactive cube
function IdleView() {
  return (
    <Canvas shadows camera={{ position: [0, 0, 12], fov: 35 }}>
      <Suspense fallback={null}>
        <Stage environment="city" intensity={0.6} adjustCamera={false}>
          <Cube />
        </Stage>
        <OrbitControls enableZoom />
      </Suspense>
    </Canvas>
  );
}

interface Scene3DProps {
  isLoading?: boolean;
}

export function Scene3D({ isLoading }: Scene3DProps) {
  const [animationType, setAnimationType] = useState<AnimationType>("physics3d");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [devMode, setDevMode] = useState(true); // Toggle to test animations

  // Show animation if loading OR in dev mode preview
  const showAnimation = isLoading || devMode;

  const renderAnimation = () => {
    switch (animationType) {
      case "physics3d":
        return <Physics3DAnimation />;
      case "tetrisVertical":
        return <TetrisVertical />;
      case "waveBlocks":
        return <WaveBlocks />;
      case "floatingCubes":
        return <FloatingCubes />;
      case "stackingBlocks":
        return <StackingBlocks />;
      case "spinningRing":
        return <SpinningRing />;
      default:
        return <Physics3DAnimation />;
    }
  };

  const currentOption = ANIMATION_OPTIONS.find((opt) => opt.value === animationType);

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden relative">
      {/* Animation Content */}
      <div className="w-full h-full">
        {showAnimation ? renderAnimation() : <IdleView />}
      </div>

      {/* Animation Selector Dropdown - Always show for testing */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur border border-black/10 rounded-lg text-sm font-medium text-neutral-700 hover:bg-white transition-colors"
          >
            <span>{currentOption?.label}</span>
            <ChevronDown
              size={16}
              className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-black/10 rounded-lg shadow-lg overflow-hidden z-30">
              {ANIMATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnimationType(option.value);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0 ${
                    animationType === option.value ? "bg-neutral-50" : ""
                  }`}
                >
                  <div className="font-medium text-sm text-neutral-800">
                    {option.label}
                  </div>
                  <div className="text-xs text-neutral-500">{option.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dev Mode Toggle */}
        <button
          onClick={() => setDevMode(!devMode)}
          className={`px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-colors ${
            devMode
              ? "bg-cyan-500 text-white border-cyan-500"
              : "bg-white/90 text-neutral-500 border-black/10 hover:bg-white"
          }`}
        >
          {devMode ? "Preview ON" : "Preview OFF"}
        </button>
      </div>

      {/* Status Overlay - Show when not in animation mode */}
      {!showAnimation && (
        <div className="absolute bottom-6 left-6 bg-white/80 backdrop-blur px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider border border-black/10">
          Interactive View
        </div>
      )}
    </div>
  );
}
