'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSpriteStore } from '@/store/useSpriteStore';
import {
  Play,
  Pause,
  Repeat,
  Film,
  Download,
  SkipBack,
  SkipForward,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { generateAndDownloadGif } from '@/lib/export/exporter';

export function AnimationPreview() {
  const { frames, selectedFrameIds, animationConfig, updateAnimationConfig, sourceImageName } =
    useSpriteStore();

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [isExportingGif, setIsExportingGif] = useState(false);
  const directionRef = useRef<1 | -1>(1);

  // Use selected frames or all frames for animation
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

  // Render current frame on preview canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Clear and draw small checkerboard
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const checkSize = 8;
    for (let y = 0; y < canvas.height; y += checkSize) {
      for (let x = 0; x < canvas.width; x += checkSize) {
        ctx.fillStyle = (Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0 ? '#1f1f23' : '#2d2d33';
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }

    if (animFrames.length === 0) return;
    const currentFrame = animFrames[activeFrameIdx] || animFrames[0];
    if (!currentFrame || !currentFrame.canvas) return;

    // Draw scaled & centered
    const scale = animationConfig.zoom;
    const fw = currentFrame.canvas.width * scale;
    const fh = currentFrame.canvas.height * scale;

    const drawX = Math.round((canvas.width - fw) / 2);
    const drawY = Math.round((canvas.height - fh) / 2);

    ctx.drawImage(currentFrame.canvas, drawX, drawY, fw, fh);
  }, [animFrames, activeFrameIdx, animationConfig.zoom]);

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
    <div className="border-t border-zinc-800 bg-zinc-900/95 backdrop-blur flex flex-col h-48 select-none">
      {/* Animation Controls Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <Film className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-zinc-200">Animation Timeline</span>
          <span className="text-zinc-500">
            ({animFrames.length} {animFrames.length === 1 ? 'frame' : 'frames'})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* FPS Selector */}
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="text-zinc-400">FPS:</span>
            <input
              type="number"
              min={1}
              max={60}
              value={animationConfig.fps}
              onChange={(e) =>
                updateAnimationConfig({ fps: Math.max(1, Math.min(60, Number(e.target.value))) })
              }
              className="w-12 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-center font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Zoom Selector */}
          <div className="flex items-center gap-1 text-zinc-300">
            <span className="text-zinc-400">Zoom:</span>
            <select
              value={animationConfig.zoom}
              onChange={(e) => updateAnimationConfig({ zoom: Number(e.target.value) })}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-1.5 py-0.5"
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
            className={`px-2 py-0.5 rounded text-xs transition flex items-center gap-1 ${
              animationConfig.pingPong
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Ping-Pong Animation Mode"
          >
            <Repeat className="w-3 h-3" />
            Ping-Pong
          </button>

          {/* Export GIF */}
          <button
            onClick={handleExportGif}
            disabled={isExportingGif || animFrames.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded font-medium transition text-xs shadow"
            title="Export loop as Animated GIF"
          >
            <Sparkles className="w-3 h-3" />
            {isExportingGif ? 'Exporting...' : 'Export GIF'}
          </button>
        </div>
      </div>

      {/* Main Preview Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Playback Preview Box */}
        <div className="w-44 flex flex-col items-center justify-center p-2 border-r border-zinc-800 bg-zinc-950/60">
          <canvas
            ref={previewCanvasRef}
            width={128}
            height={100}
            className="border border-zinc-800 rounded shadow-inner"
          />

          {/* Playback Buttons */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setActiveFrameIdx((prev) => (prev > 0 ? prev - 1 : animFrames.length - 1))}
              className="p-1 text-zinc-400 hover:text-zinc-200"
              title="Previous Frame"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => updateAnimationConfig({ isPlaying: !animationConfig.isPlaying })}
              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition shadow"
              title={animationConfig.isPlaying ? 'Pause' : 'Play'}
            >
              {animationConfig.isPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setActiveFrameIdx((prev) => (prev + 1) % animFrames.length)}
              className="p-1 text-zinc-400 hover:text-zinc-200"
              title="Next Frame"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Frames Track Scrubber */}
        <div className="flex-1 overflow-x-auto p-2 flex items-center gap-2">
          {animFrames.length === 0 ? (
            <div className="w-full text-center text-zinc-500 text-xs py-8">
              No frames extracted yet. Upload a sprite sheet or image frames to preview animations.
            </div>
          ) : (
            animFrames.map((frame, index) => {
              const isActive = index === activeFrameIdx;
              return (
                <div
                  key={frame.id}
                  onClick={() => setActiveFrameIdx(index)}
                  className={`flex-shrink-0 cursor-pointer flex flex-col items-center p-1 rounded border transition ${
                    isActive
                      ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="w-14 h-14 bg-zinc-950 rounded flex items-center justify-center overflow-hidden">
                    {frame.dataUrl ? (
                      <img
                        src={frame.dataUrl}
                        alt={frame.name}
                        className="max-w-full max-h-full object-contain [image-rendering:pixelated]"
                      />
                    ) : (
                      <div className="text-[10px] text-zinc-600">#{index}</div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 mt-1 truncate max-w-[60px]">
                    {index + 1}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
