'use client';

import React, { useState } from 'react';
import { useSpriteStore } from '@/store/useSpriteStore';
import {
  Sparkles,
  Code2,
  Palette,
  Download,
  FileArchive,
  Layers,
  Scissors,
  CheckCircle2,
  Loader2,
  FileCode,
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
    sourceImageName,
    animationConfig,
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
    setExportModal({ isOpen: true, title, progress: 25, completed: false });

    setTimeout(() => {
      setExportModal((prev) => ({ ...prev, progress: 65 }));
    }, 400);

    setTimeout(async () => {
      try {
        await action();
        setExportModal((prev) => ({ ...prev, progress: 100, completed: true }));
        setTimeout(() => {
          setExportModal((prev) => ({ ...prev, isOpen: false }));
        }, 800);
      } catch (e) {
        console.error(e);
        setExportModal((prev) => ({ ...prev, isOpen: false }));
      }
    }, 1000);
  };

  const handleExportAtlasBundle = () => {
    if (!atlasResult) return;
    runWithProgress('Bundling Texture Atlas & Engine Metadata...', async () => {
      await downloadAtlasZip(atlasResult, sourceImageName || 'spritesheet');
    });
  };

  const handleExportFramesZip = () => {
    if (frames.length === 0) return;
    runWithProgress('Compressing Individual Frames into ZIP...', async () => {
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
    runWithProgress('Compiling Animated GIF loop...', async () => {
      await generateAndDownloadGif(frames, animationConfig.fps, `${sourceImageName || 'anim'}.gif`);
    });
  };

  return (
    <>
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between select-none z-30">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight text-sm">Sprite-Forge</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 hidden sm:block">
              Online 2-in-1 Sprite Slicer & Optimal Atlas Packer
            </p>
          </div>
        </div>

        {/* Center: Unpack / Pack Mode Switcher */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setAppMode('unpack')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${
              appMode === 'unpack'
                ? 'bg-blue-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Unpack (Slicer)</span>
          </button>

          <button
            onClick={() => setAppMode('pack')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${
              appMode === 'pack'
                ? 'bg-blue-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pack (Atlas Packer)</span>
          </button>
        </div>

        {/* Right: Artist / Dev View Toggle & Export Dropdown */}
        <div className="flex items-center gap-3">
          {/* Dual Audience Mode Switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('artist')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition ${
                viewMode === 'artist'
                  ? 'bg-zinc-800 text-amber-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
              title="Artist Mode: Focused on visual fidelity, animations, and pixel art"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Artist</span>
            </button>
            <button
              onClick={() => setViewMode('developer')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition ${
                viewMode === 'developer'
                  ? 'bg-zinc-800 text-emerald-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
              title="Developer Mode: Power-of-Two, extrude bleeding guards, engine schemas"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Developer</span>
            </button>
          </div>

          {/* Export Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={frames.length === 0 && !atlasResult}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs rounded-lg transition shadow-md shadow-blue-500/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Atlas & Engine Exports
                </div>

                <button
                  onClick={handleExportAtlasBundle}
                  disabled={!atlasResult}
                  className="w-full text-left px-2.5 py-2 hover:bg-zinc-800 disabled:opacity-30 rounded-lg flex items-center gap-2 text-zinc-200"
                >
                  <FileArchive className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-medium">Atlas Bundle (ZIP)</div>
                    <div className="text-[10px] text-zinc-400">PNG + JSON + Godot tres + CSS</div>
                  </div>
                </button>

                <button
                  onClick={handleExportJsonOnly}
                  disabled={!atlasResult}
                  className="w-full text-left px-2.5 py-2 hover:bg-zinc-800 disabled:opacity-30 rounded-lg flex items-center gap-2 text-zinc-200"
                >
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-medium">Phaser / PixiJS JSON</div>
                    <div className="text-[10px] text-zinc-400">Open Hash schema metadata</div>
                  </div>
                </button>

                <button
                  onClick={handleExportGodotOnly}
                  disabled={!atlasResult}
                  className="w-full text-left px-2.5 py-2 hover:bg-zinc-800 disabled:opacity-30 rounded-lg flex items-center gap-2 text-zinc-200"
                >
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-medium">Godot 4 Atlas (.tres)</div>
                    <div className="text-[10px] text-zinc-400">Native AtlasTexture resource</div>
                  </div>
                </button>

                <div className="h-[1px] bg-zinc-800 my-1" />
                <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Raw Assets & Media
                </div>

                <button
                  onClick={handleExportFramesZip}
                  disabled={frames.length === 0}
                  className="w-full text-left px-2.5 py-2 hover:bg-zinc-800 disabled:opacity-30 rounded-lg flex items-center gap-2 text-zinc-200"
                >
                  <FileArchive className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-medium">Individual Frames (ZIP)</div>
                    <div className="text-[10px] text-zinc-400">Export frame_000.png series</div>
                  </div>
                </button>

                <button
                  onClick={handleExportGif}
                  disabled={frames.length === 0}
                  className="w-full text-left px-2.5 py-2 hover:bg-zinc-800 disabled:opacity-30 rounded-lg flex items-center gap-2 text-zinc-200"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-medium">Animated GIF Loop</div>
                    <div className="text-[10px] text-zinc-400">Shareable animation file</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Non-Intrusive Export Progress Modal (Guaranteed Ad Exposure & User Feedback) */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-96 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col items-center text-center">
            {exportModal.completed ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce mb-3" />
            ) : (
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
            )}

            <h3 className="font-semibold text-zinc-100 text-sm">{exportModal.title}</h3>
            <p className="text-xs text-zinc-400 mt-1 mb-4">
              All computations are happening 100% locally in your browser.
            </p>

            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${exportModal.progress}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-zinc-500">{exportModal.progress}%</span>
          </div>
        </div>
      )}
    </>
  );
}
