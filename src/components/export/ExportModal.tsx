'use client';

import React, { useState, useMemo } from 'react';
import { useSpriteStore } from '@/store/useSpriteStore';
import {
  X,
  Download,
  Copy,
  Check,
  Gamepad2,
  Sparkles,
  FileCode,
  FileArchive,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  generatePhaserJson,
  generatePhaserJsonArray,
  generateGodotTres,
  generateGodotSpriteFrames,
  generateUnityMeta,
  generateUnityJson,
  generateCssSprites,
  generateCsvData,
  downloadFramesZip,
  downloadAtlasZip,
  downloadUnityBundle,
  downloadGodotBundle,
  downloadUniversalBundle,
  generateAndDownloadGif,
} from '@/lib/export/exporter';
import { saveAs } from 'file-saver';
import { AtlasResult } from '@/types';

type ExportTarget =
  | 'unity'
  | 'godot'
  | 'phaser'
  | 'csv'
  | 'css'
  | 'frames'
  | 'gif'
  | 'universal';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTarget?: ExportTarget;
}

export function ExportModal({ isOpen, onClose, defaultTarget = 'unity' }: ExportModalProps) {
  const {
    atlasResult,
    frames,
    sourceImage,
    sourceImageName,
    animationConfig,
  } = useSpriteStore();

  const [target, setTarget] = useState<ExportTarget>(defaultTarget);
  const [baseName, setBaseName] = useState(sourceImageName || 'sprite_forge');
  const [godotPath, setGodotPath] = useState(`res://${sourceImageName || 'spritesheet'}.png`);
  const [godotAnimName, setGodotAnimName] = useState('default');
  const [fps, setFps] = useState(animationConfig.fps || 12);
  const [phaserFormat, setPhaserFormat] = useState<'hash' | 'array'>('hash');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Compute effective atlas: either from atlasResult or constructed from sourceImage + frames
  const effectiveAtlas = useMemo<AtlasResult | null>(() => {
    if (atlasResult) return atlasResult;

    if (sourceImage && frames.length > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = sourceImage.naturalWidth;
      canvas.height = sourceImage.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(sourceImage, 0, 0);

      return {
        canvas,
        width: sourceImage.naturalWidth,
        height: sourceImage.naturalHeight,
        frames: frames.map((f) => ({
          ...f,
          packedX: f.frame.x,
          packedY: f.frame.y,
          packedW: f.frame.w,
          packedH: f.frame.h,
        })),
        occupancyRate: 1.0,
      };
    }

    if (frames.length > 0 && frames[0].canvas) {
      // Single frame fallback
      const f = frames[0];
      return {
        canvas: f.canvas!,
        width: f.canvas!.width,
        height: f.canvas!.height,
        frames: frames.map((fr) => ({
          ...fr,
          packedX: fr.frame.x,
          packedY: fr.frame.y,
          packedW: fr.frame.w,
          packedH: fr.frame.h,
        })),
        occupancyRate: 1.0,
      };
    }

    return null;
  }, [atlasResult, sourceImage, frames]);

  // Generate live preview text based on selected engine
  const previewContent = useMemo(() => {
    if (!effectiveAtlas && target !== 'frames' && target !== 'gif') {
      return '// Load or slice sprites to generate metadata.';
    }

    const imgName = `${baseName || 'spritesheet'}.png`;
    const prefix = baseName || 'sprite';

    switch (target) {
      case 'unity':
        return generateUnityMeta(effectiveAtlas!, imgName, prefix);
      case 'godot':
        return generateGodotSpriteFrames(effectiveAtlas!, godotPath, fps, godotAnimName, prefix);
      case 'phaser':
        return phaserFormat === 'hash'
          ? JSON.stringify(generatePhaserJson(effectiveAtlas!, imgName, prefix), null, 2)
          : JSON.stringify(generatePhaserJsonArray(effectiveAtlas!, imgName, prefix), null, 2);
      case 'csv':
        return generateCsvData(effectiveAtlas!, prefix);
      case 'css':
        return generateCssSprites(effectiveAtlas!, imgName, prefix);
      case 'universal':
        return `// Universal Bundle contains all engine formats:\n// 1. ${prefix}.png (Texture Sheet)\n// 2. ${prefix}.png.meta (Unity 2D Multiple Sprites: ${prefix}_0, ${prefix}_1, ...)\n// 3. ${prefix}_godot_frames.tres (Godot 4 AnimatedSprite2D: ${prefix}_0, ${prefix}_1, ...)\n// 4. ${prefix}_godot_atlas.tres (Godot 4 AtlasTexture)\n// 5. ${prefix}_phaser.json (Phaser 3 / PixiJS: ${prefix}_0.png, ${prefix}_1.png, ...)\n// 6. ${prefix}.csv (Universal Game Engines: "${prefix}_0", "${prefix}_1", ...)\n// 7. ${prefix}.css (Web CSS Spritesheet: .${prefix}_0, .${prefix}_1, ...)`;
      case 'frames':
        return `// Individual Frame Files (0-indexed):\n// Will export ${frames.length} separate PNG files packaged in a ZIP archive.\n${frames
          .slice(0, 10)
          .map((_, i) => `// - ${prefix}_${i}.png`)
          .join('\n')}${frames.length > 10 ? `\n// ... and ${frames.length - 10} more` : ''}`;
      case 'gif':
        return `// Animated GIF Configuration:\n// Total Frames: ${frames.length}\n// Framerate: ${fps} FPS\n// Output: ${prefix}.gif`;
      default:
        return '';
    }
  }, [effectiveAtlas, target, baseName, godotPath, fps, godotAnimName, phaserFormat, frames]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const validBase = baseName || 'sprite_forge';

    try {
      if (target === 'unity' && effectiveAtlas) {
        await downloadUnityBundle(effectiveAtlas, validBase);
      } else if (target === 'godot' && effectiveAtlas) {
        await downloadGodotBundle(effectiveAtlas, validBase, fps);
      } else if (target === 'phaser' && effectiveAtlas) {
        const json =
          phaserFormat === 'hash'
            ? generatePhaserJson(effectiveAtlas, `${validBase}.png`, validBase)
            : generatePhaserJsonArray(effectiveAtlas, `${validBase}.png`, validBase);
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        saveAs(blob, `${validBase}_phaser.json`);
      } else if (target === 'csv' && effectiveAtlas) {
        const csv = generateCsvData(effectiveAtlas, validBase);
        const blob = new Blob([csv], { type: 'text/csv' });
        saveAs(blob, `${validBase}.csv`);
      } else if (target === 'css' && effectiveAtlas) {
        const css = generateCssSprites(effectiveAtlas, `${validBase}.png`, validBase);
        const blob = new Blob([css], { type: 'text/css' });
        saveAs(blob, `${validBase}.css`);
      } else if (target === 'frames') {
        await downloadFramesZip(frames, `${validBase}_frames.zip`, validBase);
      } else if (target === 'gif') {
        await generateAndDownloadGif(frames, fps, `${validBase}.gif`);
      } else if (target === 'universal' && effectiveAtlas) {
        await downloadUniversalBundle(effectiveAtlas, validBase, fps);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadMetadataOnly = () => {
    if (!effectiveAtlas) return;
    const validBase = baseName || 'sprite_forge';

    if (target === 'unity') {
      const meta = generateUnityMeta(effectiveAtlas, `${validBase}.png`, validBase);
      const blob = new Blob([meta], { type: 'text/plain' });
      saveAs(blob, `${validBase}.png.meta`);
    } else if (target === 'godot') {
      const tres = generateGodotSpriteFrames(effectiveAtlas, godotPath, fps, godotAnimName, validBase);
      const blob = new Blob([tres], { type: 'text/plain' });
      saveAs(blob, `${validBase}_sprite_frames.tres`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-[#16171d] border border-[#2b2d39] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-xs">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#25262f] bg-[#14151a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Export Game Engine Assets</h2>
              <p className="text-[11px] text-zinc-400">
                Generate optimized texture sheets and metadata for Unity, Godot 4, Phaser, or generic engines
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-[#22242f] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Left Engine Selector + Right Options & Preview */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left: Engine Selector */}
          <div className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-[#25262f] bg-[#131418] p-2 space-y-1 overflow-y-auto">
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Game Engines
            </div>

            <button
              onClick={() => setTarget('unity')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${
                target === 'unity'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-300 hover:bg-[#1e2029]'
              }`}
            >
              <Gamepad2 className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs">Unity 2D</div>
                <div className={`text-[10px] truncate ${target === 'unity' ? 'text-blue-100' : 'text-zinc-500'}`}>
                  .meta + Sprite Sheet
                </div>
              </div>
            </button>

            <button
              onClick={() => setTarget('godot')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${
                target === 'godot'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-300 hover:bg-[#1e2029]'
              }`}
            >
              <FileCode className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs">Godot 4</div>
                <div className={`text-[10px] truncate ${target === 'godot' ? 'text-blue-100' : 'text-zinc-500'}`}>
                  SpriteFrames (.tres)
                </div>
              </div>
            </button>

            <button
              onClick={() => setTarget('phaser')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${
                target === 'phaser'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-300 hover:bg-[#1e2029]'
              }`}
            >
              <FileCode className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs">Phaser / PixiJS</div>
                <div className={`text-[10px] truncate ${target === 'phaser' ? 'text-blue-100' : 'text-zinc-500'}`}>
                  JSON Hash / Array
                </div>
              </div>
            </button>

            <button
              onClick={() => setTarget('csv')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${
                target === 'csv'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-300 hover:bg-[#1e2029]'
              }`}
            >
              <FileCode className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs">Generic (CSV)</div>
                <div className={`text-[10px] truncate ${target === 'csv' ? 'text-blue-100' : 'text-zinc-500'}`}>
                  Raylib, LÖVE, Pygame
                </div>
              </div>
            </button>

            <div className="px-2.5 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Standard Formats
            </div>

            <button
              onClick={() => setTarget('universal')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${
                target === 'universal'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-300 hover:bg-[#1e2029]'
              }`}
            >
              <FileArchive className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs">All-in-One Bundle</div>
                <div className={`text-[10px] truncate ${target === 'universal' ? 'text-blue-100' : 'text-zinc-500'}`}>
                  Unity + Godot + JSON + CSS
                </div>
              </div>
            </button>

            <button
              onClick={() => setTarget('frames')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${
                target === 'frames'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-300 hover:bg-[#1e2029]'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs">Frame PNGs (ZIP)</div>
                <div className={`text-[10px] truncate ${target === 'frames' ? 'text-blue-100' : 'text-zinc-500'}`}>
                  {frames.length} individual images
                </div>
              </div>
            </button>

            <button
              onClick={() => setTarget('gif')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${
                target === 'gif'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-300 hover:bg-[#1e2029]'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs">Animated GIF</div>
                <div className={`text-[10px] truncate ${target === 'gif' ? 'text-blue-100' : 'text-zinc-500'}`}>
                  Playback animation
                </div>
              </div>
            </button>
          </div>

          {/* Right: Engine Options and Code Preview */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#171820] overflow-hidden">
            {/* Engine Description Banner */}
            <div className="p-4 border-b border-[#25262f] bg-[#1a1b24] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                  <span>
                    {target === 'unity' && 'Unity 2D Sprite Sheet Importer'}
                    {target === 'godot' && 'Godot 4 SpriteFrames & AtlasTexture'}
                    {target === 'phaser' && 'Phaser 3 & PixiJS Texture Atlas'}
                    {target === 'csv' && 'Universal CSV Sprite Coordinate Sheet'}
                    {target === 'css' && 'Web CSS Spritesheet'}
                    {target === 'universal' && 'Universal Multi-Engine Bundle'}
                    {target === 'frames' && 'Individual Frame PNGs (ZIP Archive)'}
                    {target === 'gif' && 'Animated GIF Loop'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {target === 'unity' &&
                    'Generates a Unity .png.meta with SpriteMode Multiple and bottom-left coordinates. Drop both into your Assets folder!'}
                  {target === 'godot' &&
                    'Generates a SpriteFrames .tres resource ready to drag directly onto an AnimatedSprite2D node in Godot 4.'}
                  {target === 'phaser' &&
                    'Generates standard texture atlas JSON compatible with this.load.atlas() in Phaser 3 or Pixi.js Assets.load().'}
                  {target === 'csv' &&
                    'Universal CSV with name, X, Y, W, H, and pivot coordinates for custom game engines (Raylib, LÖVE, MonoGame).'}
                  {target === 'universal' &&
                    'Bundles your texture atlas with metadata for Unity, Godot 4, Phaser, CSS, and CSV all in one download.'}
                  {target === 'frames' &&
                    'Exports all sliced frames as individual transparent PNG files named sequentially.'}
                  {target === 'gif' &&
                    'Generates a transparent looped GIF animation encoded with optimal 256-color palette.'}
                </p>
              </div>
            </div>

            {/* Config Fields */}
            <div className="p-4 border-b border-[#25262f] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-[#15161d]">
              <div>
                <label className="text-[10px] text-zinc-400 font-medium">File Name Prefix</label>
                <input
                  type="text"
                  value={baseName}
                  onChange={(e) => setBaseName(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-[#1e2029] border border-[#2b2d39] rounded text-zinc-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
                  <span>Sprites:</span>
                  <span className="text-blue-400">{baseName || 'sprite'}_0</span>,
                  <span className="text-zinc-400">{baseName || 'sprite'}_1...</span>
                </div>
              </div>

              {target === 'godot' && (
                <>
                  <div>
                    <label className="text-[10px] text-zinc-400 font-medium">Godot Resource Path</label>
                    <input
                      type="text"
                      value={godotPath}
                      onChange={(e) => setGodotPath(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-[#1e2029] border border-[#2b2d39] rounded text-zinc-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                      placeholder="res://sprites/sheet.png"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 font-medium">Animation Name</label>
                    <input
                      type="text"
                      value={godotAnimName}
                      onChange={(e) => setGodotAnimName(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-[#1e2029] border border-[#2b2d39] rounded text-zinc-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                      placeholder="default"
                    />
                  </div>
                </>
              )}

              {target === 'phaser' && (
                <div>
                  <label className="text-[10px] text-zinc-400 font-medium">JSON Format</label>
                  <select
                    value={phaserFormat}
                    onChange={(e) => setPhaserFormat(e.target.value as 'hash' | 'array')}
                    className="w-full mt-1 px-2.5 py-1.5 bg-[#1e2029] border border-[#2b2d39] rounded text-zinc-200 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="hash">JSON Hash (Default)</option>
                    <option value="array">JSON Array</option>
                  </select>
                </div>
              )}

              {(target === 'gif' || target === 'godot' || target === 'universal') && (
                <div>
                  <label className="text-[10px] text-zinc-400 font-medium">Framerate (FPS)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={fps}
                    onChange={(e) => setFps(Math.max(1, Math.min(60, Number(e.target.value))))}
                    className="w-full mt-1 px-2.5 py-1.5 bg-[#1e2029] border border-[#2b2d39] rounded text-zinc-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Code / Metadata Preview */}
            <div className="flex-1 flex flex-col min-h-0 p-4 overflow-hidden">
              <div className="flex items-center justify-between pb-2">
                <span className="text-[11px] font-mono text-zinc-400">
                  {target === 'unity' && `${baseName}.png.meta`}
                  {target === 'godot' && `${baseName}_sprite_frames.tres`}
                  {target === 'phaser' && `${baseName}.json`}
                  {target === 'csv' && `${baseName}.csv`}
                  {target === 'css' && `${baseName}.css`}
                  {target === 'universal' && 'Universal Engine Bundle'}
                  {target === 'frames' && 'Frame Manifest'}
                  {target === 'gif' && 'GIF Parameters'}
                </span>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 bg-[#20222d] hover:bg-[#272a38] border border-[#2f3242] text-zinc-300 rounded text-[11px] transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 min-h-0 bg-[#111216] border border-[#262833] rounded-lg p-3 font-mono text-[11px] text-zinc-300 overflow-auto whitespace-pre leading-relaxed select-text">
                {previewContent}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="p-3.5 border-t border-[#25262f] bg-[#14151a] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {(target === 'unity' || target === 'godot') && (
                  <button
                    onClick={handleDownloadMetadataOnly}
                    disabled={!effectiveAtlas || isDownloading}
                    className="px-3 py-2 bg-[#22242f] hover:bg-[#2b2e3c] border border-[#323646] text-zinc-200 font-medium rounded-lg text-xs transition disabled:opacity-40"
                  >
                    Download {target === 'unity' ? '.meta Only' : '.tres Only'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-transparent hover:bg-[#22242f] text-zinc-400 hover:text-zinc-200 rounded-lg text-xs transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDownload}
                  disabled={
                    (!effectiveAtlas && target !== 'frames' && target !== 'gif') ||
                    (frames.length === 0 && (target === 'frames' || target === 'gif')) ||
                    isDownloading
                  }
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {isDownloading
                      ? 'Bundling Assets...'
                      : target === 'unity'
                      ? 'Download Unity Package (ZIP)'
                      : target === 'godot'
                      ? 'Download Godot 4 Bundle (ZIP)'
                      : target === 'phaser'
                      ? 'Download Phaser JSON'
                      : target === 'csv'
                      ? 'Download CSV'
                      : target === 'frames'
                      ? 'Download Frame PNGs (ZIP)'
                      : target === 'gif'
                      ? 'Download Animated GIF'
                      : 'Download All Formats (ZIP)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
