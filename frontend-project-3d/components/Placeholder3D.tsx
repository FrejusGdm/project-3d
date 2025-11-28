export function Placeholder3D() {
  return (
    <div className="relative w-[400px] h-[400px] animate-float opacity-20 dark:opacity-10 pointer-events-none">
      {/* Central Cube Representation - Wireframe style */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-64 h-64 border border-black dark:border-white transform rotate-45 animate-spin-slow">
          <div className="absolute inset-0 border border-black dark:border-white transform rotate-[60deg]" />
          <div className="absolute inset-0 border border-black dark:border-white transform -rotate-[60deg]" />
        </div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-black dark:bg-white rounded-full animate-pulse delay-75" />
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-black dark:bg-white rounded-full animate-pulse delay-150" />
    </div>
  );
}

