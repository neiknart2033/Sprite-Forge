'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { useSpriteStore } from '@/store/useSpriteStore';
import {
  Play,
  Pause,
  Repeat,
  SkipBack,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { generateAndDownloadGif } from '@/lib/export/exporter';

// Lightweight GPU canvas-to-canvas thumbnail renderer (zero toDataURL strings)
const FrameThumbnail = memo(function FrameThumbnail({ canvas }: { canvas?: HTMLCanvasElement }) {
  const thumbRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const thumb = thumbRef.current;
    if (!thumb || !canvas) return;

    thumb.width = 44;
    thumb.height = 44;
    const ctx = thumb.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 44, 44);

    const scale = Math.min(44 / Math.max(1, canvas.width), 44 / Math.max(1, canvas.height), 1);
    const w = canvas.width * scale;
    const h = canvas.height * scale;
    const x = Math.round((44 - w) / 2);
    const y = Math.round((44 - h) / 2);
    ctx.drawImage(canvas, x, y, w, h);
  }, [canvas]);

  return <canvas ref={thumbRef} className="max-w-full max-h-full block [image-rendering:pixelated]" />;
});

export function AnimationPreview() {
  const { frames, selectedFrameIds, animationConfig, updateAnimationConfig, sourceImageName } =
    useSpriteStore();

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [isExportingGif, setIsExportingGif] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const directionRef = useRef<1 | -1>(1);

  const animFrames =
    selectedFrameIds.length > 1
      ? frames.filter((f) => selectedFrameIds.includes(f.id))
      : frames;

  // Animation Loop ticker
  useEffect(() => {
    if (!animationConfig.isPlaying || animFrames.length <= 1) return;

    const interval = 1000 / animationConfig.fps;
    const timer = setInterval(() => {
      setActiveFrameIdx((prev) => {
        if (animationConfig.pingPong) {
          let next = prev + directionRef.current;
          if (next >= animFrames.length) {
            directionRef.current = -1;
            next = Math.max(0, animFrames.length - 2);
          } else if (next < 0) {
            directionRef.current = 1;
            next = Math.min(1, animFrames.length - 1);
          }
          return next;
        } else {
          return (prev + 1) % animFrames.length;
        }
      });
    }, interval);

    return () => clearInterval(timer);
  }, [animationConfig.isPlaying, animationConfig.fps, animationConfig.pingPong, animFrames.length]);

  // Render current frame on preview canvas (Instant GPU clear)
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (animFrames.length === 0) return;
    const currentFrame = animFrames[activeFrameIdx] || animFrames[0];
    if (!currentFrame || !currentFrame.canvas) return;

    const scale = animationConfig.zoom;
    const fw = currentFrame.canvas.width * scale;
    const fh = currentFrame.canvas.height * scale;

    const drawX = Math.round((canvas.width - fw) / 2);
    const drawY = Math.round((canvas.height - fh) / 2);

    ctx.drawImage(currentFrame.canvas, drawX, drawY, fw, fh);
  }, [animFrames, activeFrameIdx, animationConfig.zoom, isExpanded]);

  const handleExportGif = async () => {
    if (animFrames.length === 0) return;
    setIsExportingGif(true);
    try {
      await generateAndDownloadGif(
        animFrames,
        animationConfig.fps,
        `${sourceImageName || 'animation'}.gif`
      );
    } catch (e) {
      console.error('Failed to export GIF', e);
    } finally {
      setIsExportingGif(false);
    }
  };

  return (
    <div className="border-t border-[#25262e] bg-[#16171c] flex flex-col select-none transition-all duration-200">
      {/* Sleek Collapsible Bar */}
      <div className="flex items-center justify-between px-3 h-8 border-b border-[#25262e] text-xs">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 cursor-pointer hover:text-zinc-200 text-zinc-400 transition"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
          )}
          <span className="font-medium text-xs text-zinc-300">Timeline Preview</span>
          <span className="text-[11px] text-zinc-500 font-mono">
            {animFrames.length} {animFrames.length === 1 ? 'frame' : 'frames'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Play/Pause on bar */}
          <button
            onClick={() => updateAnimationConfig({ isPlaying: !animationConfig.isPlaying })}
            className="p-1 hover:bg-[#252733] text-zinc-300 rounded transition"
            title={animationConfig.isPlaying ? 'Pause' : 'Play'}
          >
            {animationConfig.isPlaying ? (
              <Pause className="w-3 h-3 text-blue-400" />
            ) : (
              <Play className="w-3 h-3 text-zinc-300" />
            )}
          </button>

          {/* Quick FPS input */}
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <span>FPS:</span>
            <input
              type="number"
              min={1}
              max={60}
              value={animationConfig.fps}
              onChange={(e) =>
                updateAnimationConfig({ fps: Math.max(1, Math.min(60, Number(e.target.value))) })
              }
              className="w-10 px-1 py-0.5 bg-[#1e1f26] border border-[#2b2d38] rounded text-center font-mono text-zinc-200 focus:outline-none focus:border-blue-500 text-[11px]"
            />
          </div>

          {/* Zoom Selector */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400">
            <span>Zoom:</span>
            <select
              value={animationConfig.zoom}
              onChange={(e) => updateAnimationConfig({ zoom: Number(e.target.value) })}
              className="bg-[#1e1f26] border border-[#2b2d38] text-zinc-200 text-[11px] rounded px-1 py-0.5"
            >
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={3}>3×</option>
              <option value={4}>4×</option>
            </select>
          </div>

          {/* Ping-pong toggle */}
          <button
            onClick={() => updateAnimationConfig({ pingPong: !animationConfig.pingPong })}
            className={`px-1.5 py-0.5 rounded text-[11px] transition flex items-center gap-1 ${
              animationConfig.pingPong
                ? 'bg-[#272938] text-blue-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Ping-Pong Mode"
          >
            <Repeat className="w-2.5 h-2.5" />
            <span>Ping-Pong</span>
          </button>

          {/* Export GIF */}
          <button
            onClick={handleExportGif}
            disabled={isExportingGif || animFrames.length === 0}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#232634] hover:bg-[#2b2e40] border border-[#35384a] text-zinc-300 hover:text-white rounded text-[11px] transition disabled:opacity-40"
            title="Export GIF"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>{isExportingGif ? 'Encoding...' : 'GIF'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Track & Preview Canvas */}
      {isExpanded && (
        <div className="flex h-36 overflow-hidden">
          {/* Playback Box */}
          <div className="w-36 flex flex-col items-center justify-center p-2 border-r border-[#25262e] bg-[#131418]">
            <canvas
              ref={previewCanvasRef}
              width={96}
              height={80}
              className="border border-[#262731] rounded canvas-checkerboard-sm"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() =>
                  setActiveFrameIdx((prev) => (prev > 0 ? prev - 1 : animFrames.length - 1))
                }
                className="p-0.5 text-zinc-500 hover:text-zinc-300"
              >
                <SkipBack className="w-3 h-3" />
              </button>
              <button
                onClick={() => updateAnimationConfig({ isPlaying: !animationConfig.isPlaying })}
                className="p-1 bg-[#252733] hover:bg-[#2f3140] text-zinc-200 rounded-full transition"
              >
                {animationConfig.isPlaying ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => setActiveFrameIdx((prev) => (prev + 1) % animFrames.length)}
                className="p-0.5 text-zinc-500 hover:text-zinc-300"
              >
                <SkipForward className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Frames Track */}
          <div className="flex-1 overflow-x-auto p-2 flex items-center gap-2">
            {animFrames.length === 0 ? (
              <div className="w-full text-center text-zinc-600 text-xs py-6">
                No frames loaded yet.
              </div>
            ) : (
              animFrames.map((frame, index) => {
                const isActive = index === activeFrameIdx;
                return (
                  <div
                    key={frame.id}
                    onClick={() => setActiveFrameIdx(index)}
                    className={`flex-shrink-0 cursor-pointer flex flex-col items-center p-1 rounded transition border ${
                      isActive
                        ? 'border-blue-500/70 bg-[#242735]'
                        : 'border-[#262732] bg-[#181920] hover:border-[#383a48]'
                    }`}
                  >
                    <div className="w-12 h-12 bg-[#121316] rounded flex items-center justify-center overflow-hidden">
                      <FrameThumbnail canvas={frame.canvas} />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 mt-1">{index + 1}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
