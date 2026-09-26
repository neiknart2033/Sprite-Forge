'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { useSpriteStore } from '@/store/useSpriteStore';
import {
  Play,
  Pause,
  Repeat,
  SkipBack,
  SkipForward,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Film,
  Download,
  Trash2,
  LayoutGrid,
  List,
  Image as ImageIcon,
} from 'lucide-react';
import { generateAndDownloadGif, downloadFramesZip } from '@/lib/export/exporter';

// Lightweight GPU canvas-to-canvas thumbnail renderer (zero toDataURL strings)
const FrameThumbnail = memo(function FrameThumbnail({ canvas }: { canvas?: HTMLCanvasElement }) {
  const thumbRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const thumb = thumbRef.current;
    if (!thumb || !canvas) return;

    thumb.width = 56;
    thumb.height = 56;
    const ctx = thumb.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 56, 56);

    const scale = Math.min(56 / Math.max(1, canvas.width), 56 / Math.max(1, canvas.height), 1);
    const w = canvas.width * scale;
    const h = canvas.height * scale;
    const x = Math.round((56 - w) / 2);
    const y = Math.round((56 - h) / 2);
    ctx.drawImage(canvas, x, y, w, h);
  }, [canvas]);

  return <canvas ref={thumbRef} className="max-w-full max-h-full block [image-rendering:pixelated]" />;
});

export function AnimationPreview({
  standalone = true,
  onCollapse,
}: {
  standalone?: boolean;
  onCollapse?: () => void;
}) {
  const {
    frames,
    selectedFrameIds,
    selectFrame,
    removeFrame,
    animationConfig,
    updateAnimationConfig,
    sourceImageName,
  } = useSpriteStore();

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [isExportingGif, setIsExportingGif] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPlayerOpen, setIsPlayerOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const directionRef = useRef<1 | -1>(1);

  const animFrames =
    selectedFrameIds.length > 1
      ? frames.filter((f) => selectedFrameIds.includes(f.id))
      : frames;

  const safeActiveIdx = activeFrameIdx >= animFrames.length ? 0 : activeFrameIdx;

  // Keep index valid when frame count changes
  useEffect(() => {
    if (activeFrameIdx >= animFrames.length && animFrames.length > 0) {
      setActiveFrameIdx(0);
    }
  }, [animFrames.length, activeFrameIdx]);

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
    if (!canvas || !isExpanded || !isPlayerOpen) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (animFrames.length === 0) return;
    const currentFrame = animFrames[safeActiveIdx] || animFrames[0];
    if (!currentFrame || !currentFrame.canvas) return;

    const baseW = currentFrame.canvas.width;
    const baseH = currentFrame.canvas.height;
    const maxScale = Math.min(canvas.width / Math.max(1, baseW), canvas.height / Math.max(1, baseH));

    const userZoom = animationConfig.zoom || 1;
    const scale = baseW * userZoom > canvas.width || baseH * userZoom > canvas.height
      ? maxScale
      : userZoom;

    const fw = Math.round(baseW * scale);
    const fh = Math.round(baseH * scale);

    const drawX = Math.round((canvas.width - fw) / 2);
    const drawY = Math.round((canvas.height - fh) / 2);

    ctx.drawImage(currentFrame.canvas, drawX, drawY, fw, fh);
  }, [animFrames, safeActiveIdx, animationConfig.zoom, isExpanded, isPlayerOpen]);

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

  const handleQuickDownloadZip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (frames.length === 0) return;
    setIsExportingZip(true);
    try {
      await downloadFramesZip(frames, `${sourceImageName || 'sprite'}_sliced_frames.zip`);
    } catch (err) {
      console.error('Failed to download ZIP', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Collapsed Sidebar View (Only when standalone)
  if (!isExpanded && standalone) {
    return (
      <div className="w-9 shrink-0 border-l border-[#25262e] bg-[#16171c] flex flex-col items-center py-2.5 select-none z-10 transition-all duration-200">
        <button
          onClick={() => setIsExpanded(true)}
          className="p-1.5 hover:bg-[#252733] text-zinc-400 hover:text-zinc-100 rounded transition"
          title="Expand Animation Preview"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          onClick={() => setIsExpanded(true)}
          className="mt-6 flex flex-col items-center gap-2 cursor-pointer group py-2"
          title="Expand Animation Preview"
        >
          <Film className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 transition" />
          <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 tracking-wider">
            Results & Anim
          </span>
          <span className="font-mono text-[10px] text-zinc-600 group-hover:text-zinc-400">
            {animFrames.length}
          </span>
        </div>
      </div>
    );
  }

  // Expanded Column View (strictly bounds height to prevent stretching the webpage)
  return (
    <aside className="w-full md:w-72 shrink-0 border-l border-[#25262e] bg-[#16171c] flex flex-col h-full max-h-full min-h-0 overflow-hidden select-none z-10 text-xs transition-all duration-200">
      {/* 1. Panel Header */}
      <div className="shrink-0 px-3 py-2 border-b border-[#25262e] flex items-center justify-between bg-[#15161b]">
        <div className="flex items-center gap-2">
          <Film className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-[11px] text-zinc-200 uppercase tracking-wider">
            Timeline Preview
          </span>
          <span className="text-[10px] font-mono text-zinc-400 bg-[#1f2029] px-1.5 py-0.5 rounded border border-[#2b2d39]">
            {animFrames.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {standalone && (
            <button
              onClick={() => {
                if (onCollapse) onCollapse();
                else setIsExpanded(false);
              }}
              className="p-1 hover:bg-[#252733] text-zinc-400 hover:text-zinc-200 rounded transition"
              title="Collapse Panel"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Player Box & Playback Controls (Collapsible accordion) */}
      <div className="shrink-0 border-b border-[#25262e] bg-[#131418]">
        {/* Player sub-header toggle */}
        <div
          onClick={() => setIsPlayerOpen(!isPlayerOpen)}
          className="px-3 py-1.5 flex items-center justify-between cursor-pointer hover:bg-[#181921] transition text-[11px] text-zinc-400 border-b border-[#1f2029]"
        >
          <div className="flex items-center gap-1.5">
            {isPlayerOpen ? (
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            )}
            <span className="font-medium text-zinc-300">Animation Player</span>
          </div>
          {animFrames.length > 0 && (
            <span className="text-[10px] font-mono text-zinc-500">
              Frame {safeActiveIdx + 1}/{animFrames.length}
            </span>
          )}
        </div>

        {isPlayerOpen && (
          <div className="p-3 flex flex-col items-center gap-2.5">
            {/* Animated Canvas */}
            <div className="relative w-full flex flex-col items-center justify-center py-2 bg-[#101114] rounded-lg border border-[#252732] overflow-hidden">
              <canvas
                ref={previewCanvasRef}
                width={128}
                height={100}
                className="rounded canvas-checkerboard-sm [image-rendering:pixelated]"
              />
              {animFrames.length > 0 && (
                <div className="absolute bottom-1 right-2 text-[10px] font-mono text-zinc-500 bg-[#14151b]/80 px-1 rounded">
                  {safeActiveIdx + 1}/{animFrames.length}
                </div>
              )}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-2 w-full">
              <button
                onClick={() =>
                  setActiveFrameIdx((prev) => (prev > 0 ? prev - 1 : animFrames.length - 1))
                }
                disabled={animFrames.length <= 1}
                className="p-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition"
                title="Previous Frame"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => updateAnimationConfig({ isPlaying: !animationConfig.isPlaying })}
                disabled={animFrames.length <= 1}
                className="w-7 h-7 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full transition disabled:opacity-40 shadow-sm shadow-blue-500/20"
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
                disabled={animFrames.length <= 1}
                className="p-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition"
                title="Next Frame"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-3.5 bg-[#25262e] mx-0.5" />

              {/* Ping-Pong Mode */}
              <button
                onClick={() => updateAnimationConfig({ pingPong: !animationConfig.pingPong })}
                className={`p-1.5 rounded transition ${
                  animationConfig.pingPong
                    ? 'bg-[#272938] text-blue-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Ping-Pong Loop"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* FPS & Zoom Settings */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="flex items-center justify-between bg-[#191a21] border border-[#262834] rounded px-2 py-1">
                <span className="text-[10px] text-zinc-400 font-medium">FPS</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={animationConfig.fps}
                  onChange={(e) =>
                    updateAnimationConfig({
                      fps: Math.max(1, Math.min(60, Number(e.target.value))),
                    })
                  }
                  className="w-8 text-right font-mono text-zinc-200 text-[11px] bg-transparent focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between bg-[#191a21] border border-[#262834] rounded px-2 py-1">
                <span className="text-[10px] text-zinc-400 font-medium">Zoom</span>
                <select
                  value={animationConfig.zoom}
                  onChange={(e) => updateAnimationConfig({ zoom: Number(e.target.value) })}
                  className="bg-transparent text-right text-zinc-200 text-[11px] focus:outline-none cursor-pointer"
                >
                  <option value={1} className="bg-[#191a21]">1×</option>
                  <option value={2} className="bg-[#191a21]">2×</option>
                  <option value={3} className="bg-[#191a21]">3×</option>
                  <option value={4} className="bg-[#191a21]">4×</option>
                </select>
              </div>
            </div>

            {/* Export GIF Button */}
            <button
              onClick={handleExportGif}
              disabled={isExportingGif || animFrames.length === 0}
              className="w-full py-1.5 px-2 bg-[#222430] hover:bg-[#2a2d3c] border border-[#323547] text-zinc-200 font-medium rounded-md flex items-center justify-center gap-1.5 transition text-[11px] disabled:opacity-40"
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>{isExportingGif ? 'Generating GIF...' : 'Export GIF'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Sliced Result Images List (Scrollable, NEVER elongates page) */}
      <div className="flex-1 min-h-0 max-h-full flex flex-col overflow-hidden bg-[#14151a]">
        {/* Results Header with View Mode and Quick Download */}
        <div className="shrink-0 px-3 py-2 border-b border-[#25262e] bg-[#17181f] flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold text-zinc-200">Sliced Results</span>
            <span className="text-[10px] font-mono text-zinc-500">
              ({frames.length})
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#1f2029] border border-[#2c2e3c] rounded p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded transition ${
                  viewMode === 'grid'
                    ? 'bg-[#2d3040] text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3 h-3" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded transition ${
                  viewMode === 'list'
                    ? 'bg-[#2d3040] text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="List View"
              >
                <List className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Download ZIP Button */}
            {frames.length > 0 && (
              <button
                onClick={handleQuickDownloadZip}
                disabled={isExportingZip}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded text-[10px] font-medium transition"
                title="Download All Sliced Frames as ZIP"
              >
                <Download className="w-2.5 h-2.5" />
                <span>{isExportingZip ? 'Zipping...' : 'ZIP'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Container (Strictly bounds height to prevent window elongation) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 select-none">
          {frames.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500">
              <ImageIcon className="w-6 h-6 mb-2 text-zinc-600 stroke-1" />
              <p className="text-[11px] leading-relaxed">
                No sliced frames yet. Drop a PNG sprite sheet or load sample to view results here.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 gap-2">
              {frames.map((frame, index) => {
                const isActive = index === safeActiveIdx;
                const isSelected = selectedFrameIds.includes(frame.id);
                return (
                  <div
                    key={frame.id}
                    onClick={(e) => {
                      setActiveFrameIdx(index);
                      selectFrame(frame.id, e.shiftKey);
                    }}
                    className={`group relative cursor-pointer rounded-lg p-1.5 border transition flex flex-col items-center ${
                      isActive
                        ? 'border-blue-500 bg-[#212433] ring-1 ring-blue-500/50'
                        : isSelected
                        ? 'border-blue-400/60 bg-[#1d1f2b]'
                        : 'border-[#262734] bg-[#181920] hover:border-[#383a4c]'
                    }`}
                  >
                    <div className="w-full h-16 bg-[#111216] rounded flex items-center justify-center overflow-hidden p-1 canvas-checkerboard-sm">
                      <FrameThumbnail canvas={frame.canvas} />
                    </div>

                    <div className="w-full mt-1.5 flex items-center justify-between text-[10px] font-mono px-0.5">
                      <span className={isActive ? 'text-blue-400 font-semibold' : 'text-zinc-400'}>
                        #{index + 1}
                      </span>
                      <span className="text-zinc-500 text-[9px]">
                        {frame.frame.w}×{frame.frame.h}
                      </span>
                    </div>

                    {/* Quick Delete Frame Button on Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFrame(frame.id);
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-950/80 hover:bg-red-800 border border-red-500/40 text-red-200 rounded opacity-0 group-hover:opacity-100 transition shadow"
                      title="Delete Frame"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Compact List View */
            <div className="space-y-1.5">
              {frames.map((frame, index) => {
                const isActive = index === safeActiveIdx;
                const isSelected = selectedFrameIds.includes(frame.id);
                return (
                  <div
                    key={frame.id}
                    onClick={(e) => {
                      setActiveFrameIdx(index);
                      selectFrame(frame.id, e.shiftKey);
                    }}
                    className={`group cursor-pointer rounded-md p-1.5 border transition flex items-center gap-2.5 ${
                      isActive
                        ? 'border-blue-500 bg-[#212433] ring-1 ring-blue-500/50'
                        : isSelected
                        ? 'border-blue-400/60 bg-[#1d1f2b]'
                        : 'border-[#262734] bg-[#181920] hover:border-[#383a4c]'
                    }`}
                  >
                    <div className="w-10 h-10 shrink-0 bg-[#111216] rounded flex items-center justify-center overflow-hidden p-0.5 canvas-checkerboard-sm">
                      <FrameThumbnail canvas={frame.canvas} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-mono truncate ${isActive ? 'text-blue-400 font-medium' : 'text-zinc-200'}`}>
                          #{index + 1} {frame.name || `frame_${index}`}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2 mt-0.5">
                        <span>{frame.frame.w}×{frame.frame.h}px</span>
                        <span>at ({frame.frame.x},{frame.frame.y})</span>
                      </div>
                    </div>

                    {/* Quick Delete Frame Button on Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFrame(frame.id);
                      }}
                      className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition"
                      title="Delete Frame"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
