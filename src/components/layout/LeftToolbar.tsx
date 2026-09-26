'use client';

import React, { useRef } from 'react';
import { useSpriteStore } from '@/store/useSpriteStore';
import {
  Upload,
  FolderOpen,
  Scissors,
  Layers,
  Crosshair,
  CheckSquare,
  RotateCcw,
} from 'lucide-react';

export function LeftToolbar() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    appMode,
    setAppMode,
    loadSourceImage,
    loadMultipleFrames,
    selectAllFrames,
    resetAll,
    setPivotForSelected,
    selectedFrameIds,
    frames,
  } = useSpriteStore();

  const handleSingleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadSourceImage(file);
    }
  };

  const handleMultiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      loadMultipleFrames(Array.from(files));
    }
  };

  return (
    <aside className="w-11 border-r border-[#25262e] bg-[#16171c] flex flex-col items-center py-2.5 gap-2 select-none z-20">
      {/* Upload Single Sheet */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleSingleUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-7 h-7 rounded-md hover:bg-[#252733] text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition group relative"
        title="Upload Sprite Sheet"
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="absolute left-10 bg-[#202129] border border-[#2e303d] text-zinc-200 text-[11px] px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
          Upload Sheet
        </span>
      </button>

      {/* Upload Multiple Frame PNGs */}
      <input
        ref={multiFileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        onChange={handleMultiUpload}
        className="hidden"
      />
      <button
        onClick={() => multiFileInputRef.current?.click()}
        className="w-7 h-7 rounded-md hover:bg-[#252733] text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition group relative"
        title="Import Frame Files"
      >
        <FolderOpen className="w-3.5 h-3.5" />
        <span className="absolute left-10 bg-[#202129] border border-[#2e303d] text-zinc-200 text-[11px] px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
          Import Frames
        </span>
      </button>

      <div className="w-5 h-[1px] bg-[#25262e] my-1" />

      {/* Slicer Mode */}
      <button
        onClick={() => setAppMode('unpack')}
        className={`w-7 h-7 rounded-md flex items-center justify-center transition group relative ${
          appMode === 'unpack'
            ? 'bg-[#272936] text-blue-400 border border-[#353849]'
            : 'hover:bg-[#252733] text-zinc-400 hover:text-zinc-200'
        }`}
        title="Slicer Tool"
      >
        <Scissors className="w-3.5 h-3.5" />
        <span className="absolute left-10 bg-[#202129] border border-[#2e303d] text-zinc-200 text-[11px] px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
          Slicer
        </span>
      </button>

      {/* Packer Mode */}
      <button
        onClick={() => setAppMode('pack')}
        className={`w-7 h-7 rounded-md flex items-center justify-center transition group relative ${
          appMode === 'pack'
            ? 'bg-[#272936] text-blue-400 border border-[#353849]'
            : 'hover:bg-[#252733] text-zinc-400 hover:text-zinc-200'
        }`}
        title="Atlas Packer Tool"
      >
        <Layers className="w-3.5 h-3.5" />
        <span className="absolute left-10 bg-[#202129] border border-[#2e303d] text-zinc-200 text-[11px] px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
          Atlas Packer
        </span>
      </button>

      <div className="w-5 h-[1px] bg-[#25262e] my-1" />

      {/* Quick Bottom Pivot */}
      <button
        onClick={() => setPivotForSelected(0.5, 1.0)}
        disabled={selectedFrameIds.length === 0}
        className="w-7 h-7 rounded-md hover:bg-[#252733] disabled:opacity-25 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition group relative"
        title="Set Bottom-Center Pivot"
      >
        <Crosshair className="w-3.5 h-3.5" />
        <span className="absolute left-10 bg-[#202129] border border-[#2e303d] text-zinc-200 text-[11px] px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
          Set Bottom Pivot
        </span>
      </button>

      {/* Select All */}
      <button
        onClick={selectAllFrames}
        disabled={frames.length === 0}
        className="w-7 h-7 rounded-md hover:bg-[#252733] disabled:opacity-25 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition group relative"
        title="Select All Frames"
      >
        <CheckSquare className="w-3.5 h-3.5" />
        <span className="absolute left-10 bg-[#202129] border border-[#2e303d] text-zinc-200 text-[11px] px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
          Select All
        </span>
      </button>

      {/* Reset */}
      <div className="mt-auto">
        <button
          onClick={resetAll}
          className="w-7 h-7 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400 flex items-center justify-center transition group relative"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="absolute left-10 bg-[#202129] border border-[#2e303d] text-zinc-200 text-[11px] px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
            Reset All
          </span>
        </button>
      </div>
    </aside>
  );
}
