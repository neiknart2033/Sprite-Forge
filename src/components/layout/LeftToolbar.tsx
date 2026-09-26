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
  Trash2,
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
    clearSelection,
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
    <aside className="w-14 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-3 gap-4 select-none z-20">
      {/* Upload Single Spritesheet */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleSingleUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex flex-col items-center justify-center transition shadow-lg shadow-blue-600/20 group relative"
        title="Upload Sprite Sheet"
      >
        <Upload className="w-5 h-5" />
        <span className="absolute left-14 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
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
        className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition group relative"
        title="Import Frame Files (Multiple PNGs)"
      >
        <FolderOpen className="w-4 h-4" />
        <span className="absolute left-14 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
          Import Frames
        </span>
      </button>

      <div className="w-8 h-[1px] bg-zinc-800" />

      {/* Unpack Mode Toggle */}
      <button
        onClick={() => setAppMode('unpack')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
          appMode === 'unpack'
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
        }`}
        title="Unpack / Slicer"
      >
        <Scissors className="w-4 h-4" />
        <span className="absolute left-14 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
          Unpack Slicer
        </span>
      </button>

      {/* Pack Mode Toggle */}
      <button
        onClick={() => setAppMode('pack')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
          appMode === 'pack'
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
        }`}
        title="Texture Atlas Packer"
      >
        <Layers className="w-4 h-4" />
        <span className="absolute left-14 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
          Pack Atlas
        </span>
      </button>

      <div className="w-8 h-[1px] bg-zinc-800" />

      {/* Pivot Tool Quick Preset: Bottom-Center (0.5, 1.0) */}
      <button
        onClick={() => setPivotForSelected(0.5, 1.0)}
        disabled={selectedFrameIds.length === 0}
        className="w-10 h-10 rounded-xl hover:bg-zinc-900 disabled:opacity-30 text-rose-400 flex items-center justify-center transition group relative"
        title="Set Pivot to Bottom-Center (Standard 2D Game Pivot)"
      >
        <Crosshair className="w-4 h-4" />
        <span className="absolute left-14 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
          Set Bottom Anchor (0.5, 1.0)
        </span>
      </button>

      {/* Select All */}
      <button
        onClick={selectAllFrames}
        disabled={frames.length === 0}
        className="w-10 h-10 rounded-xl hover:bg-zinc-900 disabled:opacity-30 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition group relative"
        title="Select All Frames"
      >
        <CheckSquare className="w-4 h-4" />
        <span className="absolute left-14 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
          Select All Frames
        </span>
      </button>

      {/* Reset Workspace */}
      <div className="mt-auto">
        <button
          onClick={resetAll}
          className="w-10 h-10 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-400 flex items-center justify-center transition group relative"
          title="Reset Workspace"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="absolute left-14 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
            Reset Everything
          </span>
        </button>
      </div>
    </aside>
  );
}
