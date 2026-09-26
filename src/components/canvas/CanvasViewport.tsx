'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSpriteStore } from '@/store/useSpriteStore';
import { ZoomIn, ZoomOut, Maximize, Grid, Eye, Upload, Sparkles } from 'lucide-react';
import { generateSampleSpriteSheet } from '@/lib/sampleAsset';

export function CanvasViewport() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    appMode,
    sourceImage,
    atlasResult,
    frames,
    selectedFrameIds,
    viewport,
    setViewport,
    selectFrame,
    unpackConfig,
    loadSourceImage,
    loadMultipleFrames,
  } = useSpriteStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);

  const handleLoadSample = async () => {
    const sampleCanvas = generateSampleSpriteSheet();
    sampleCanvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'knight_sample_sheet.png', { type: 'image/png' });
        await loadSourceImage(file);
      }
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 1 && appMode === 'unpack') {
      await loadSourceImage(files[0]);
    } else if (files.length > 0) {
      if (appMode === 'pack') {
        await loadMultipleFrames(files);
      } else {
        await loadSourceImage(files[0]);
      }
    }
  };

  // Handle Space key for panning cursor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle Wheel Zoom anchored at mouse position
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const cursorCanvasX = e.clientX - rect.left;
      const cursorCanvasY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.2 : 0.833;
      const newZoom = Math.min(32.0, Math.max(0.1, viewport.zoom * zoomFactor));

      // Zoom centered at cursor
      const newPanX = cursorCanvasX - (cursorCanvasX - viewport.panX) * (newZoom / viewport.zoom);
      const newPanY = cursorCanvasY - (cursorCanvasY - viewport.panY) * (newZoom / viewport.zoom);

      setViewport({
        zoom: newZoom,
        panX: newPanX,
        panY: newPanY,
      });
    },
    [viewport, setViewport]
  );

  // Mouse Down for Pan or Selection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || isSpacePressed || e.button === 0 && e.altKey) {
      // Middle click or Space + Left click or Alt + Left click: Pan
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewport.panX, y: e.clientY - viewport.panY });
      return;
    }

    if (e.button === 0) {
      // Left click: detect if clicked inside a frame bounding box
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = (e.clientX - rect.left - viewport.panX) / viewport.zoom;
      const mouseY = (e.clientY - rect.top - viewport.panY) / viewport.zoom;

      if (appMode === 'unpack') {
        // Find clicked frame
        const clicked = frames.find(
          (f) =>
            mouseX >= f.frame.x &&
            mouseX <= f.frame.x + f.frame.w &&
            mouseY >= f.frame.y &&
            mouseY <= f.frame.y + f.frame.h
        );

        if (clicked) {
          selectFrame(clicked.id, e.shiftKey);
          return;
        }
      } else if (appMode === 'pack' && atlasResult) {
        const clicked = atlasResult.frames.find(
          (f) =>
            mouseX >= f.packedX &&
            mouseX <= f.packedX + f.packedW &&
            mouseY >= f.packedY &&
            mouseY <= f.packedY + f.packedH
        );

        if (clicked) {
          selectFrame(clicked.id, e.shiftKey);
          return;
        }
      }

      // If clicked empty space, start panning
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewport.panX, y: e.clientY - viewport.panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const imgX = Math.floor((e.clientX - rect.left - viewport.panX) / viewport.zoom);
      const imgY = Math.floor((e.clientY - rect.top - viewport.panY) / viewport.zoom);
      setMousePos({ x: imgX, y: imgY });
    }

    if (isDragging) {
      setViewport({
        panX: e.clientX - dragStart.x,
        panY: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Center / Fit Image to Viewport
  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const targetW =
      appMode === 'unpack' ? sourceImage?.naturalWidth || 512 : atlasResult?.width || 512;
    const targetH =
      appMode === 'unpack' ? sourceImage?.naturalHeight || 512 : atlasResult?.height || 512;

    const padding = 40;
    const availableW = container.clientWidth - padding;
    const availableH = container.clientHeight - padding;

    const scale = Math.min(availableW / targetW, availableH / targetH, 4.0);
    const newZoom = Math.max(0.2, scale);

    const panX = (container.clientWidth - targetW * newZoom) / 2;
    const panY = (container.clientHeight - targetH * newZoom) / 2;

    setViewport({ zoom: newZoom, panX, panY });
  }, [appMode, sourceImage, atlasResult, setViewport]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Resize canvas to match display container
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Nearest-neighbor scaling for crisp pixel art!
    ctx.imageSmoothingEnabled = false;

    // 1. Draw Checkerboard background
    const { width: cw, height: ch } = canvas;
    ctx.clearRect(0, 0, cw, ch);

    const checkSize = 16;
    for (let y = 0; y < ch; y += checkSize) {
      for (let x = 0; x < cw; x += checkSize) {
        ctx.fillStyle = (Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0 ? '#18181b' : '#27272a';
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }

    // 2. Apply Pan & Zoom transformation
    ctx.save();
    ctx.translate(viewport.panX, viewport.panY);
    ctx.scale(viewport.zoom, viewport.zoom);

    if (appMode === 'unpack' && sourceImage) {
      // Draw Source Spritesheet
      ctx.drawImage(sourceImage, 0, 0);

      // Draw Grid Overlay if enabled
      if (viewport.showGrid && unpackConfig.mode === 'grid') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1 / viewport.zoom;
        const fw = unpackConfig.frameWidth;
        const fh = unpackConfig.frameHeight;
        const sx = unpackConfig.spacingX;
        const sy = unpackConfig.spacingY;

        for (let y = unpackConfig.marginY; y + fh <= sourceImage.naturalHeight; y += fh + sy) {
          for (let x = unpackConfig.marginX; x + fw <= sourceImage.naturalWidth; x += fw + sx) {
            ctx.strokeRect(x, y, fw, fh);
          }
        }
      }

      // Draw Bounding Boxes
      if (viewport.showBBoxes) {
        frames.forEach((frame, idx) => {
          const isSelected = selectedFrameIds.includes(frame.id);

          ctx.lineWidth = (isSelected ? 2 : 1) / viewport.zoom;
          ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.45)';
          ctx.strokeRect(frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h);

          if (isSelected) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
            ctx.fillRect(frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h);

            // Draw Pivot indicator
            const pivotPx = frame.frame.x + frame.frame.w * frame.pivot.x;
            const pivotPy = frame.frame.y + frame.frame.h * frame.pivot.y;
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 1.5 / viewport.zoom;
            ctx.beginPath();
            ctx.arc(pivotPx, pivotPy, 4 / viewport.zoom, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Frame index label
          if (viewport.zoom >= 0.8) {
            ctx.fillStyle = isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.8)';
            ctx.font = `${Math.max(9, Math.floor(10 / viewport.zoom))}px monospace`;
            ctx.fillText(
              `#${idx}`,
              frame.frame.x + 2 / viewport.zoom,
              frame.frame.y + 10 / viewport.zoom
            );
          }
        });
      }
    } else if (appMode === 'pack' && atlasResult) {
      // Draw Packed Texture Atlas
      ctx.drawImage(atlasResult.canvas, 0, 0);

      // Atlas outer border
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1 / viewport.zoom;
      ctx.strokeRect(0, 0, atlasResult.width, atlasResult.height);

      // Draw Bounding Boxes in Atlas
      if (viewport.showBBoxes) {
        atlasResult.frames.forEach((pf) => {
          const isSelected = selectedFrameIds.includes(pf.id);

          ctx.lineWidth = (isSelected ? 2 : 1) / viewport.zoom;
          ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(16, 185, 129, 0.45)';
          ctx.strokeRect(pf.packedX, pf.packedY, pf.packedW, pf.packedH);

          if (isSelected) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
            ctx.fillRect(pf.packedX, pf.packedY, pf.packedW, pf.packedH);
          }
        });
      }
    }

    ctx.restore();
  }, [
    viewport,
    appMode,
    sourceImage,
    atlasResult,
    frames,
    selectedFrameIds,
    unpackConfig,
  ]);

  const hasContent = Boolean(sourceImage || (atlasResult && atlasResult.frames.length > 0) || frames.length > 0);

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative w-full h-full overflow-hidden select-none bg-zinc-950 ${
        isSpacePressed || isDragging ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
      }`}
    >
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full block"
      />

      {/* Empty State Overlay */}
      {!hasContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-zinc-950/70 backdrop-blur-xs pointer-events-none">
          <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 text-center shadow-2xl pointer-events-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Drop Sprite Sheet or Images</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Drag and drop your composite sprite sheet or individual frame PNGs anywhere on this
                canvas.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={handleLoadSample}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Try Demo Pixel Knight</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag Over Visual Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 border-4 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none flex items-center justify-center z-40 animate-pulse">
          <div className="bg-blue-600 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-2xl">
            Drop your image files to process!
          </div>
        </div>
      )}

      {/* Floating Viewport Controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-1.5 shadow-lg text-zinc-300 text-xs">
        <button
          onClick={() =>
            setViewport({ zoom: Math.min(32.0, Math.round(viewport.zoom * 1.25 * 10) / 10) })
          }
          className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="font-mono px-1 min-w-[44px] text-center font-medium">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          onClick={() =>
            setViewport({ zoom: Math.max(0.1, Math.round((viewport.zoom / 1.25) * 10) / 10) })
          }
          className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-700 mx-1" />

        <button
          onClick={fitToScreen}
          className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition"
          title="Fit to Screen"
        >
          <Maximize className="w-4 h-4" />
        </button>

        <button
          onClick={() => setViewport({ showGrid: !viewport.showGrid })}
          className={`p-1.5 rounded transition ${
            viewport.showGrid
              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
              : 'hover:bg-zinc-800 text-zinc-400'
          }`}
          title="Toggle Grid"
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={() => setViewport({ showBBoxes: !viewport.showBBoxes })}
          className={`p-1.5 rounded transition ${
            viewport.showBBoxes
              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
              : 'hover:bg-zinc-800 text-zinc-400'
          }`}
          title="Toggle Bounding Boxes"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Mouse Coordinates & Canvas Size Info */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-400 text-xs font-mono">
        <div>
          X: <span className="text-zinc-200">{mousePos.x}</span>, Y:{' '}
          <span className="text-zinc-200">{mousePos.y}</span>
        </div>
        <div className="w-[1px] h-3.5 bg-zinc-800" />
        <div>
          {appMode === 'unpack' && sourceImage ? (
            <span>
              Image: {sourceImage.naturalWidth} × {sourceImage.naturalHeight}px
            </span>
          ) : appMode === 'pack' && atlasResult ? (
            <span>
              Atlas: {atlasResult.width} × {atlasResult.height}px (
              {Math.round(atlasResult.occupancyRate * 100)}% fill)
            </span>
          ) : (
            <span>No asset loaded</span>
          )}
        </div>
      </div>
    </div>
  );
}
