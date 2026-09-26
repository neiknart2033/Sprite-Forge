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
    if (e.button === 1 || isSpacePressed || (e.button === 0 && e.altKey)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewport.panX, y: e.clientY - viewport.panY });
      return;
    }

    if (e.button === 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = (e.clientX - rect.left - viewport.panX) / viewport.zoom;
      const mouseY = (e.clientY - rect.top - viewport.panY) / viewport.zoom;

      if (appMode === 'unpack') {
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

    const padding = 48;
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

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // 1. Soothing Low-Contrast Checkerboard (Charcoal palette)
    const { width: cw, height: ch } = canvas;
    ctx.clearRect(0, 0, cw, ch);

    const checkSize = 16;
    for (let y = 0; y < ch; y += checkSize) {
      for (let x = 0; x < cw; x += checkSize) {
        ctx.fillStyle =
          (Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0
            ? '#121317'
            : '#18191f';
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }

    // 2. Apply Pan & Zoom transformation
    ctx.save();
    ctx.translate(viewport.panX, viewport.panY);
    ctx.scale(viewport.zoom, viewport.zoom);

    if (appMode === 'unpack' && sourceImage) {
      ctx.drawImage(sourceImage, 0, 0);

      // Grid overlay
      if (viewport.showGrid && unpackConfig.mode === 'grid') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
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

      // Bounding Boxes: crisp, delicate 1px borders
      if (viewport.showBBoxes) {
        frames.forEach((frame, idx) => {
          const isSelected = selectedFrameIds.includes(frame.id);

          ctx.lineWidth = (isSelected ? 1.5 : 1) / viewport.zoom;
          ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(150, 160, 180, 0.35)';
          ctx.strokeRect(frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h);

          if (isSelected) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
            ctx.fillRect(frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h);

            // Pivot indicator
            const pivotPx = frame.frame.x + frame.frame.w * frame.pivot.x;
            const pivotPy = frame.frame.y + frame.frame.h * frame.pivot.y;
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 1.2 / viewport.zoom;
            ctx.beginPath();
            ctx.arc(pivotPx, pivotPy, 3.5 / viewport.zoom, 0, Math.PI * 2);
            ctx.stroke();
          }

          if (viewport.zoom >= 0.9) {
            ctx.fillStyle = isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.5)';
            ctx.font = `${Math.max(9, Math.floor(9 / viewport.zoom))}px monospace`;
            ctx.fillText(
              `#${idx}`,
              frame.frame.x + 2 / viewport.zoom,
              frame.frame.y + 9 / viewport.zoom
            );
          }
        });
      }
    } else if (appMode === 'pack' && atlasResult) {
      ctx.drawImage(atlasResult.canvas, 0, 0);

      // Atlas border
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
      ctx.lineWidth = 1 / viewport.zoom;
      ctx.strokeRect(0, 0, atlasResult.width, atlasResult.height);

      if (viewport.showBBoxes) {
        atlasResult.frames.forEach((pf) => {
          const isSelected = selectedFrameIds.includes(pf.id);

          ctx.lineWidth = (isSelected ? 1.5 : 1) / viewport.zoom;
          ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(52, 211, 153, 0.35)';
          ctx.strokeRect(pf.packedX, pf.packedY, pf.packedW, pf.packedH);

          if (isSelected) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
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

  const hasContent = Boolean(
    sourceImage || (atlasResult && atlasResult.frames.length > 0) || frames.length > 0
  );

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative w-full h-full overflow-hidden select-none bg-[#121316] ${
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

      {/* Clean Slate Empty State Card */}
      {!hasContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
          <div className="max-w-xs w-full bg-[#181920] border border-[#272833] rounded-xl p-6 text-center shadow-xl pointer-events-auto space-y-4">
            <div className="w-10 h-10 rounded-lg bg-[#22242e] border border-[#2f313f] text-zinc-300 mx-auto flex items-center justify-center">
              <Upload className="w-4 h-4 text-zinc-400" />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-zinc-100">Drop Images Here</h3>
              <p className="text-[11px] text-zinc-500 mt-1">
                Drag sprite sheet or PNG frames to slice and pack
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={handleLoadSample}
                className="w-full py-1.5 px-3 bg-[#242735] hover:bg-[#2b2e40] border border-[#35384a] text-zinc-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Load Sample Knight</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag Over Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-500/5 pointer-events-none flex items-center justify-center z-40">
          <div className="bg-[#1e202b] border border-blue-500/40 text-blue-400 font-medium text-xs px-4 py-2 rounded-lg shadow-xl">
            Drop file to open
          </div>
        </div>
      )}

      {/* Minimal Floating Viewport Pill HUD */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-[#1a1b22]/90 backdrop-blur-md border border-[#292a35] rounded-lg p-1 text-zinc-400 text-xs shadow-md">
        <button
          onClick={() =>
            setViewport({ zoom: Math.min(32.0, Math.round(viewport.zoom * 1.25 * 10) / 10) })
          }
          className="p-1 hover:bg-[#252632] hover:text-zinc-200 rounded transition"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono px-1 min-w-[38px] text-center text-[11px] text-zinc-300">
          {Math.round(viewport.zoom * 100)}%
        </span>

        <button
          onClick={() =>
            setViewport({ zoom: Math.max(0.1, Math.round((viewport.zoom / 1.25) * 10) / 10) })
          }
          className="p-1 hover:bg-[#252632] hover:text-zinc-200 rounded transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 bg-[#2a2b37] mx-0.5" />

        <button
          onClick={fitToScreen}
          className="p-1 hover:bg-[#252632] hover:text-zinc-200 rounded transition"
          title="Fit to Screen"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setViewport({ showGrid: !viewport.showGrid })}
          className={`p-1 rounded transition ${
            viewport.showGrid
              ? 'bg-[#272938] text-blue-400'
              : 'hover:bg-[#252632] text-zinc-400 hover:text-zinc-200'
          }`}
          title="Toggle Grid"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setViewport({ showBBoxes: !viewport.showBBoxes })}
          className={`p-1 rounded transition ${
            viewport.showBBoxes
              ? 'bg-[#272938] text-blue-400'
              : 'hover:bg-[#252632] text-zinc-400 hover:text-zinc-200'
          }`}
          title="Toggle Bounding Boxes"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Discreet Coordinate & Dimension Info */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2.5 bg-[#1a1b22]/90 backdrop-blur-md border border-[#292a35] rounded-lg px-2.5 py-1 text-zinc-400 text-[11px] font-mono shadow-md">
        <div>
          {mousePos.x}, {mousePos.y}
        </div>
        <div className="w-[1px] h-3 bg-[#2a2b37]" />
        <div>
          {appMode === 'unpack' && sourceImage ? (
            <span>
              {sourceImage.naturalWidth}×{sourceImage.naturalHeight}px
            </span>
          ) : appMode === 'pack' && atlasResult ? (
            <span>
              {atlasResult.width}×{atlasResult.height}px (
              {Math.round(atlasResult.occupancyRate * 100)}%)
            </span>
          ) : (
            <span className="text-zinc-500">Ready</span>
          )}
        </div>
      </div>
    </div>
  );
}
