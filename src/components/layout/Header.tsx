'use client';

import React, { useState } from 'react';
import { useSpriteStore } from '@/store/useSpriteStore';
import {
  Download,
  FileArchive,
  Layers,
  Scissors,
  CheckCircle2,
  Loader2,
  FileCode,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import {
  downloadAtlasZip,
  downloadFramesZip,
  generateAndDownloadGif,
  generatePhaserJson,
  generateGodotTres,
} from '@/lib/export/exporter';
import { saveAs } from 'file-saver';

export function Header() {
  const {
    appMode,
    setAppMode,
    viewMode,
    setViewMode,
    atlasResult,
    frames,
    sourceImage,
    sourceImageName,
    animationConfig,
    runUnpack,
    runPack,
  } = useSpriteStore();

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportModal, setExportModal] = useState<{
    isOpen: boolean;
    title: string;
    progress: number;
    completed: boolean;
  }>({
    isOpen: false,
    title: '',
    progress: 0,
    completed: false,
  });

  const runWithProgress = async (title: string, action: () => Promise<void>) => {
    setIsExportMenuOpen(false);
    setExportModal({ isOpen: true, title, progress: 30, completed: false });

    setTimeout(() => {
      setExportModal((prev) => ({ ...prev, progress: 75 }));
    }, 350);

    setTimeout(async () => {
      try {
        await action();
        setExportModal((prev) => ({ ...prev, progress: 100, completed: true }));
        setTimeout(() => {
          setExportModal((prev) => ({ ...prev, isOpen: false }));
        }, 600);
      } catch (e) {
        console.error(e);
        setExportModal((prev) => ({ ...prev, isOpen: false }));
      }
    }, 850);
  };

  const handleExportAtlasBundle = () => {
    if (!atlasResult) return;
    runWithProgress('Bundling Texture Atlas...', async () => {
      await downloadAtlasZip(atlasResult, sourceImageName || 'spritesheet');
    });
  };

  const handleExportFramesZip = () => {
    if (frames.length === 0) return;
    runWithProgress('Exporting Frame PNGs (ZIP)...', async () => {
      await downloadFramesZip(frames, `${sourceImageName || 'sprite'}_frames.zip`);
    });
  };

  const handleExportJsonOnly = () => {
    if (!atlasResult) return;
    const json = generatePhaserJson(atlasResult, `${sourceImageName || 'spritesheet'}.png`);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    saveAs(blob, `${sourceImageName || 'spritesheet'}.json`);
    setIsExportMenuOpen(false);
  };

  const handleExportGodotOnly = () => {
    if (!atlasResult) return;
    const tres = generateGodotTres(atlasResult, `res://${sourceImageName || 'spritesheet'}.png`);
    const blob = new Blob([tres], { type: 'text/plain' });
    saveAs(blob, `${sourceImageName || 'spritesheet'}.tres`);
    setIsExportMenuOpen(false);
  };

  const handleExportGif = () => {
    if (frames.length === 0) return;
    runWithProgress('Encoding Animated GIF...', async () => {
      await generateAndDownloadGif(frames, animationConfig.fps, `${sourceImageName || 'anim'}.gif`);
    });
  };

  return (
    <>
      <header className="h-12 border-b border-[#25262e] bg-[#16171c] px-4 flex items-center justify-between select-none z-30">
        {/* Left: Clean Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#252733] border border-[#333544] flex items-center justify-center text-zinc-200">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-100 text-xs tracking-tight">Sprite-Forge</span>
            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">v1.0</span>
          </div>
        </div>

        {/* Center: Segmented Controls (Figma / Webflow style) */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#1e1f26] border border-[#2b2c36] rounded-md p-0.5 text-xs">
            <button
              onClick={() => setAppMode('unpack')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition text-xs font-medium ${
                appMode === 'unpack'
                  ? 'bg-[#2b2d39] text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Scissors className="w-3 h-3" />
              <span>Slicer</span>
            </button>
            <button
              onClick={() => setAppMode('pack')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition text-xs font-medium ${
                appMode === 'pack'
                  ? 'bg-[#2b2d39] text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Atlas Packer</span>
            </button>
          </div>

          {/* Direct Action Button: Cắt Sprite / Đóng Gói Atlas */}
          {appMode === 'unpack' ? (
            <button
              onClick={runUnpack}
              disabled={!sourceImage}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs rounded-md transition shadow-xs"
              title="Cắt Sprite Sheet thành các frame riêng"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Cắt Sprite</span>
            </button>
          ) : (
            <button
              onClick={runPack}
              disabled={frames.length === 0}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs rounded-md transition shadow-xs"
              title="Đóng gói các frame vào Texture Atlas"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Đóng Gói Atlas</span>
            </button>
          )}

          {/* Perspective View Switcher */}
          <div className="hidden md:flex items-center bg-[#1e1f26] border border-[#2b2c36] rounded-md p-0.5 text-xs">
            <button
              onClick={() => setViewMode('artist')}
              className={`px-2.5 py-1 rounded transition text-xs font-medium ${
                viewMode === 'artist'
                  ? 'bg-[#2b2d39] text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Artist
            </button>
            <button
              onClick={() => setViewMode('developer')}
              className={`px-2.5 py-1 rounded transition text-xs font-medium ${
                viewMode === 'developer'
                  ? 'bg-[#2b2d39] text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Developer
            </button>
          </div>
        </div>

        {/* Right: Export Button */}
        <div className="relative">
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={frames.length === 0 && !atlasResult}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252836] hover:bg-[#2e3142] border border-[#383a4d] disabled:opacity-40 text-zinc-100 font-medium text-xs rounded-md transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-[#1c1d23] border border-[#2c2d38] rounded-lg shadow-xl p-1 z-50 text-xs">
              <button
                onClick={handleExportAtlasBundle}
                disabled={!atlasResult}
                className="w-full text-left px-2.5 py-2 hover:bg-[#252732] disabled:opacity-30 rounded-md flex items-center gap-2.5 text-zinc-200 transition"
              >
                <FileArchive className="w-3.5 h-3.5 text-blue-400" />
                <div>
                  <div className="font-medium text-xs">Atlas Bundle (ZIP)</div>
                  <div className="text-[10px] text-zinc-500">PNG + JSON + Godot .tres + CSS</div>
                </div>
              </button>

              <button
                onClick={handleExportJsonOnly}
                disabled={!atlasResult}
                className="w-full text-left px-2.5 py-2 hover:bg-[#252732] disabled:opacity-30 rounded-md flex items-center gap-2.5 text-zinc-200 transition"
              >
                <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                <div>
                  <div className="font-medium text-xs">Phaser / PixiJS JSON</div>
                  <div className="text-[10px] text-zinc-500">Hash format metadata</div>
                </div>
              </button>

              <button
                onClick={handleExportGodotOnly}
                disabled={!atlasResult}
                className="w-full text-left px-2.5 py-2 hover:bg-[#252732] disabled:opacity-30 rounded-md flex items-center gap-2.5 text-zinc-200 transition"
              >
                <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                <div>
                  <div className="font-medium text-xs">Godot 4 Atlas (.tres)</div>
                  <div className="text-[10px] text-zinc-500">AtlasTexture resource</div>
                </div>
              </button>

              <div className="h-[1px] bg-[#292a34] my-1" />

              <button
                onClick={handleExportFramesZip}
                disabled={frames.length === 0}
                className="w-full text-left px-2.5 py-2 hover:bg-[#252732] disabled:opacity-30 rounded-md flex items-center gap-2.5 text-zinc-200 transition"
              >
                <FileArchive className="w-3.5 h-3.5 text-zinc-400" />
                <div>
                  <div className="font-medium text-xs">Individual Frames (ZIP)</div>
                  <div className="text-[10px] text-zinc-500">Extracted frame_000.png</div>
                </div>
              </button>

              <button
                onClick={handleExportGif}
                disabled={frames.length === 0}
                className="w-full text-left px-2.5 py-2 hover:bg-[#252732] disabled:opacity-30 rounded-md flex items-center gap-2.5 text-zinc-200 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <div>
                  <div className="font-medium text-xs">Animated GIF</div>
                  <div className="text-[10px] text-zinc-500">Preview animation loop</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Clean Slate Export Progress Modal */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-80 bg-[#1c1d24] border border-[#2e303d] rounded-xl p-5 shadow-2xl flex flex-col items-center text-center">
            {exportModal.completed ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2.5" />
            ) : (
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2.5" />
            )}

            <h3 className="font-medium text-zinc-200 text-xs">{exportModal.title}</h3>
            <p className="text-[11px] text-zinc-500 mt-1 mb-3">Processing client-side...</p>

            <div className="w-full bg-[#272833] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${exportModal.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
