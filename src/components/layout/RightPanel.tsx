'use client';

import React from 'react';
import { useSpriteStore } from '@/store/useSpriteStore';
import {
  Sliders,
  Maximize2,
  Box,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export function RightPanel() {
  const {
    appMode,
    viewMode,
    unpackConfig,
    updateUnpackConfig,
    packConfig,
    updatePackConfig,
    atlasResult,
    frames,
    selectedFrameIds,
  } = useSpriteStore();

  return (
    <aside className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col h-full select-none z-20 overflow-y-auto">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-xs uppercase tracking-wider text-zinc-200">
            {appMode === 'unpack' ? 'Slicer Parameters' : 'Packer Parameters'}
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">
          {viewMode === 'artist' ? 'Artist View' : 'Dev View'}
        </span>
      </div>

      <div className="p-4 space-y-5 text-xs text-zinc-300 flex-1">
        {/* ===================== UNPACK PARAMETERS ===================== */}
        {appMode === 'unpack' && (
          <>
            {/* Slicing Method Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Detection Method</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
                <button
                  onClick={() => updateUnpackConfig({ mode: 'grid' })}
                  className={`py-1.5 rounded text-xs font-medium transition ${
                    unpackConfig.mode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Uniform Grid
                </button>
                <button
                  onClick={() => updateUnpackConfig({ mode: 'alpha' })}
                  className={`py-1.5 rounded text-xs font-medium transition ${
                    unpackConfig.mode === 'alpha'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Alpha Auto-Detect
                </button>
              </div>
            </div>

            {unpackConfig.mode === 'grid' ? (
              <>
                {/* Frame Dimension */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400">Frame Width (px)</label>
                    <input
                      type="number"
                      min={1}
                      max={2048}
                      value={unpackConfig.frameWidth}
                      onChange={(e) =>
                        updateUnpackConfig({ frameWidth: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400">Frame Height (px)</label>
                    <input
                      type="number"
                      min={1}
                      max={2048}
                      value={unpackConfig.frameHeight}
                      onChange={(e) =>
                        updateUnpackConfig({ frameHeight: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Spacing & Margins (Visible in Developer View) */}
                {viewMode === 'developer' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400">Spacing X (px)</label>
                        <input
                          type="number"
                          min={0}
                          value={unpackConfig.spacingX}
                          onChange={(e) =>
                            updateUnpackConfig({ spacingX: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400">Spacing Y (px)</label>
                        <input
                          type="number"
                          min={0}
                          value={unpackConfig.spacingY}
                          onChange={(e) =>
                            updateUnpackConfig({ spacingY: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400">Margin X (px)</label>
                        <input
                          type="number"
                          min={0}
                          value={unpackConfig.marginX}
                          onChange={(e) =>
                            updateUnpackConfig({ marginX: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400">Margin Y (px)</label>
                        <input
                          type="number"
                          min={0}
                          value={unpackConfig.marginY}
                          onChange={(e) =>
                            updateUnpackConfig({ marginY: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Discard Empty Frames */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={unpackConfig.discardEmpty}
                    onChange={(e) => updateUnpackConfig({ discardEmpty: e.target.checked })}
                    className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs text-zinc-300">Discard Transparent Frames</span>
                </label>
              </>
            ) : (
              <>
                {/* Alpha Auto-Detect Settings */}
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Alpha Threshold</span>
                    <span className="font-mono text-zinc-200">{unpackConfig.alphaThreshold} / 255</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={255}
                    value={unpackConfig.alphaThreshold}
                    onChange={(e) => updateUnpackConfig({ alphaThreshold: Number(e.target.value) })}
                    className="w-full accent-blue-500 bg-zinc-800 h-1.5 rounded"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400">Min Cluster Size (Pixels)</label>
                  <input
                    type="number"
                    min={1}
                    value={unpackConfig.minPixelCount}
                    onChange={(e) =>
                      updateUnpackConfig({ minPixelCount: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* ===================== PACK PARAMETERS ===================== */}
        {appMode === 'pack' && (
          <>
            {/* Algorithm Heuristic */}
            <div>
              <label className="text-[11px] text-zinc-400">Packing Algorithm</label>
              <select
                value={packConfig.algorithm}
                onChange={(e) =>
                  updatePackConfig({
                    algorithm: e.target.value as 'maxrects-bssf' | 'maxrects-baf' | 'binary-tree',
                  })
                }
                className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="maxrects-bssf">MaxRects (Best Short Side Fit)</option>
                <option value="maxrects-baf">MaxRects (Best Area Fit)</option>
                <option value="binary-tree">Binary Tree (Fast Preview)</option>
              </select>
            </div>

            {/* Padding & Extrude */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400">Padding (px)</label>
                <input
                  type="number"
                  min={0}
                  max={32}
                  value={packConfig.padding}
                  onChange={(e) =>
                    updatePackConfig({ padding: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400" title="Edge pixel duplicate to prevent texture bleed">
                  Extrude (1px)
                </label>
                <select
                  value={packConfig.extrude}
                  onChange={(e) => updatePackConfig({ extrude: Number(e.target.value) })}
                  className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value={0}>0px (None)</option>
                  <option value={1}>1px (Bleed Guard)</option>
                </select>
              </div>
            </div>

            {/* Power of Two (POT) Lock */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={packConfig.potLock}
                  onChange={(e) => updatePackConfig({ potLock: e.target.checked })}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span className="text-xs text-zinc-300">Power-of-Two Lock (512, 1024, 2048)</span>
              </label>

              {/* Alpha Trimming */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={packConfig.trimAlpha}
                  onChange={(e) => updatePackConfig({ trimAlpha: e.target.checked })}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span className="text-xs text-zinc-300">Trim Transparent Pixels</span>
              </label>
            </div>

            {/* Sort Strategy */}
            <div>
              <label className="text-[11px] text-zinc-400">Sort Heuristic</label>
              <select
                value={packConfig.sortBy}
                onChange={(e) =>
                  updatePackConfig({
                    sortBy: e.target.value as 'max-side' | 'area' | 'width' | 'height' | 'name',
                  })
                }
                className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="max-side">Max Dimension Descending</option>
                <option value="area">Area Descending</option>
                <option value="width">Width Descending</option>
                <option value="height">Height Descending</option>
                <option value="name">File Name</option>
              </select>
            </div>
          </>
        )}

        {/* Selected Frame Metrics */}
        <div className="pt-2 border-t border-zinc-800 text-[11px] space-y-1.5 text-zinc-400">
          <div className="flex justify-between">
            <span>Total Frames:</span>
            <span className="font-mono text-zinc-200">{frames.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Selected:</span>
            <span className="font-mono text-blue-400">{selectedFrameIds.length}</span>
          </div>
          {atlasResult && appMode === 'pack' && (
            <>
              <div className="flex justify-between">
                <span>Atlas Size:</span>
                <span className="font-mono text-zinc-200">
                  {atlasResult.width} × {atlasResult.height}px
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fill Efficiency:</span>
                <span className="font-mono text-emerald-400">
                  {Math.round(atlasResult.occupancyRate * 100)}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===================== STICKY AD UNIT (MONETIZATION REQUIREMENT) ===================== */}
      {/* Unit 2: Sticky Right Rail (300x250) positioned right below configuration sliders */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex flex-col items-center">
        <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-600 mb-1.5">
          Advertisement
        </div>
        <div className="w-[280px] h-[220px] rounded-lg bg-zinc-900 border border-dashed border-zinc-700/80 flex flex-col items-center justify-center text-center p-3 text-zinc-500">
          <Box className="w-8 h-8 text-zinc-600 mb-2 stroke-1" />
          <span className="text-xs font-medium text-zinc-400">Google AdSense Unit (300×250)</span>
          <span className="text-[10px] text-zinc-600 mt-1">High-Viewability Sticky Rail Placement</span>
        </div>
      </div>
    </aside>
  );
}
