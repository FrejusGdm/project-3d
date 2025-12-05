"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface ModelPreviewProps {
  plyUrl: string | null; // Now actually a GLB URL
  thumbnailUrl?: string | null;
  isHovered?: boolean;
}

// Wrapper component for model-viewer to avoid TypeScript issues with web components
function ModelViewer({ 
  src, 
  onLoad, 
  onError 
}: { 
  src: string; 
  onLoad?: () => void; 
  onError?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create model-viewer element
    const modelViewer = document.createElement("model-viewer");
    modelViewer.setAttribute("src", src);
    modelViewer.setAttribute("alt", "3D Model");
    modelViewer.setAttribute("auto-rotate", "");
    modelViewer.setAttribute("camera-controls", "");
    modelViewer.setAttribute("shadow-intensity", "1");
    modelViewer.setAttribute("exposure", "1.2");
    modelViewer.setAttribute("camera-orbit", "0deg 75deg 105%");
    modelViewer.style.width = "100%";
    modelViewer.style.height = "100%";
    modelViewer.style.backgroundColor = "transparent";

    // Add event listeners
    const handleLoad = () => onLoad?.();
    const handleError = () => onError?.();
    
    modelViewer.addEventListener("load", handleLoad);
    modelViewer.addEventListener("error", handleError);

    containerRef.current.appendChild(modelViewer);

    return () => {
      modelViewer.removeEventListener("load", handleLoad);
      modelViewer.removeEventListener("error", handleError);
      modelViewer.remove();
    };
  }, [src, onLoad, onError]);

  return <div ref={containerRef} className="w-full h-full" />;
}

export function ModelPreview({
  plyUrl,
  thumbnailUrl,
  isHovered = false,
}: ModelPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset loading state when hover changes
  useEffect(() => {
    if (isHovered) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [isHovered]);

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
          unoptimized
        />
      )}

      {/* Placeholder when no thumbnail */}
      {!thumbnailUrl && !shouldShow3D && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
          <div className="w-16 h-16 rounded-xl bg-neutral-300/50" />
        </div>
      )}

      {/* 3D Model Viewer on hover - using Google's model-viewer */}
      {shouldShow3D && (
        <>
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 z-10">
              <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            </div>
          )}
          <ModelViewer
            src={plyUrl}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
        </>
      )}

      {/* Error state */}
      {hasError && isHovered && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <span className="text-sm text-red-500">Failed to load model</span>
        </div>
      )}

      {/* Hover indicator */}
      {plyUrl && !isHovered && !hasError && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-md backdrop-blur-sm">
          Hover for 3D
        </div>
      )}
    </div>
  );
}
