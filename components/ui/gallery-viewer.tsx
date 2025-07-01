"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryViewerProps {
  images: string[];
  onClose: () => void;
  initialIndex: number;
}

export function GalleryViewer({ images, onClose, initialIndex }: GalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMobile, setIsMobile] = useState(false);
  const [zoom, setZoom] = useState(1); // Start at 100% zoom
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set initial zoom based on device
  useEffect(() => {
    setZoom(isMobile ? 1 : 0.5);
  }, [isMobile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, images.length]);



  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    // Reset zoom and position when changing images
    setZoom(isMobile ? 1 : 0.5);
    setPosition({ x: 0, y: 0 });
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    // Reset zoom and position when changing images
    setZoom(isMobile ? 1 : 0.5);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleReset = () => {
    setZoom(isMobile ? 1 : 0.5);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > (isMobile ? 1 : 0.5)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > (isMobile ? 1 : 0.5)) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Zoom controls - hidden on mobile */}
      {!isMobile && (
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="text-white hover:bg-white/20"
            title="Zoom In"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="text-white hover:bg-white/20"
            title="Zoom Out"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-white hover:bg-white/20"
            title="Reset View"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Main image */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // When zoomed in, scroll the image up/down with slower speed
          if (zoom > (isMobile ? 1 : 0.5)) {
            const scrollSpeed = 5; // Much slower scroll speed
            setPosition(prev => ({
              x: prev.x,
              y: prev.y - (e.deltaY * scrollSpeed)
            }));
          }
        }}
      >
        <img
          src={images[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
                      style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              cursor: zoom > (isMobile ? 1 : 0.5) ? 'grab' : 'default',
            }}
          draggable={false}
        />
      </div>

      {/* Image counter and zoom level */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm flex items-center gap-2">
        {images.length > 1 && (
          <span>{currentIndex + 1} / {images.length}</span>
        )}
        {zoom !== (isMobile ? 1 : 0.5) && (
          <span className="text-xs opacity-75">{Math.round(zoom * 100)}%</span>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                index === currentIndex ? "border-white" : "border-white/30"
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 