'use client';

import React from 'react';
import { useSpriteStore } from '@/store/useSpriteStore';
import { Sliders, Box, Scissors, Layers, Sparkles, RefreshCw } from 'lucide-react';

export function RightPanel() {
  const {
    appMode,
    viewMode,
    sourceImage,
    unpackConfig,
    updateUnpackConfig,
    packConfig,
    updatePackConfig,
    atlasResult,
    frames,
    selectedFrameIds,
    runUnpack,
    runPack,
  } = useSpriteStore();

  return (
    <aside className="w-64 border-l border-[#25262e] bg-[#16171c] flex flex-col h-full select-none z-20 overflow-y-auto text-xs">
      {/* Inspector Header */}
      <div className="px-3.5 py-2.5 border-b border-[#25262e] flex items-center justify-between">
        <span className="font-semibold text-[11px] text-zinc-300 uppercase tracking-wider">
          {appMode === 'unpack' ? 'Slicer Inspector' : 'Packer Inspector'}
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">
          {viewMode === 'artist' ? 'Artist' : 'Developer'}
        </span>
      </div>

      <div className="p-3.5 space-y-4 flex-1">
        {/* ===================== UNPACK (SLICER) SECTION ===================== */}
        {appMode === 'unpack' && (
          <>
            {/* PROMINENT ACTION BUTTON: CẮT SPRITE */}
            <button
              onClick={runUnpack}
              disabled={!sourceImage}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm flex items-center justify-center gap-2 text-xs transition"
            >
              <Scissors className="w-4 h-4" />
              <span>Cắt Sprite (Slice Sheet)</span>
            </button>

            {/* Detection Method */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-medium">Detection Method</label>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#1f2027] border border-[#2b2d38] rounded-md">
                <button
                  onClick={() => updateUnpackConfig({ mode: 'grid' })}
                  className={`py-1 rounded text-[11px] font-medium transition ${
                    unpackConfig.mode === 'grid'
                      ? 'bg-[#2b2d39] text-zinc-100 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => updateUnpackConfig({ mode: 'alpha' })}
                  className={`py-1 rounded text-[11px] font-medium transition ${
                    unpackConfig.mode === 'alpha'
                      ? 'bg-[#2b2d39] text-zinc-100 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Alpha
                </button>
              </div>
            </div>

            {unpackConfig.mode === 'grid' ? (
              <div className="space-y-2.5">
                {/* Frame Dimension */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500">Width (W)</label>
                    <input
                      type="number"
                      min={1}
                      max={2048}
                      value={unpackConfig.frameWidth}
                      onChange={(e) =>
                        updateUnpackConfig({ frameWidth: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-full mt-0.5 px-2 py-1 bg-[#1e1f26] border border-[#2b2d37] rounded text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500">Height (H)</label>
                    <input
                      type="number"
                      min={1}
                      max={2048}
                      value={unpackConfig.frameHeight}
                      onChange={(e) =>
                        updateUnpackConfig({ frameHeight: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-full mt-0.5 px-2 py-1 bg-[#1e1f26] border border-[#2b2d37] rounded text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Spacing & Margins in Dev View */}
                {viewMode === 'developer' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-500">Spacing X</label>
                        <input
                          type="number"
                          min={0}
                          value={unpackConfig.spacingX}
                          onChange={(e) =>
                            updateUnpackConfig({ spacingX: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-full mt-0.5 px-2 py-1 bg-[#1e1f26] border border-[#2b2d37] rounded text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Spacing Y</label>
                        <input
                          type="number"
                          min={0}
                          value={unpackConfig.spacingY}
                          onChange={(e) =>
                            updateUnpackConfig({ spacingY: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-full mt-0.5 px-2 py-1 bg-[#1e1f26] border border-[#2b2d37] rounded text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-500">Margin X</label>
                        <input
                          type="number"
                          min={0}
                          value={unpackConfig.marginX}
                          onChange={(e) =>
                            updateUnpackConfig({ marginX: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-full mt-0.5 px-2 py-1 bg-[#1e1f26] border border-[#2b2d37] rounded text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Margin Y</label>
                        <input
                          type="number"
                          min={0}
                          value={unpackConfig.marginY}
                          onChange={(e) =>
                            updateUnpackConfig({ marginY: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-full mt-0.5 px-2 py-1 bg-[#1e1f26] border border-[#2b2d37] rounded text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Discard Empty */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={unpackConfig.discardEmpty}
                    onChange={(e) => updateUnpackConfig({ discardEmpty: e.target.checked })}
                    className="w-3.5 h-3.5 rounded bg-[#1f2027] border-[#2b2d38] text-blue-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-zinc-400">Bỏ qua ô trong suốt</span>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Alpha Cutoff</span>
                    <span className="font-mono text-zinc-300">{unpackConfig.alphaThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={255}
                    value={unpackConfig.alphaThreshold}
                    onChange={(e) => updateUnpackConfig({ alphaThreshold: Number(e.target.value) })}
                    className="w-full accent-blue-500 bg-[#252632] h-1 rounded"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500">Min Cluster Size (Pixel)</label>
                  <input
                    type="number"
                    min={1}
                    value={unpackConfig.minPixelCount}
                    onChange={(e) =>
                      updateUnpackConfig({ minPixelCount: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-full mt-0.5 px-2 py-1 bg-[#1e1f26] border border-[#2b2d37] rounded text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* ===================== HỖ TRỢ JPG (XÓA NỀN ẢNH) ===================== */}
            <div className="pt-2 border-t border-[#25262e] space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] font-medium text-zinc-300">
                  Xóa màu nền (Hỗ trợ JPG)
                </span>
                <input
                  type="checkbox"
                  checked={unpackConfig.removeBgColor}
                  onChange={(e) => updateUnpackConfig({ removeBgColor: e.target.checked })}
                  className="w-3.5 h-3.5 rounded bg-[#1f2027] border-[#2b2d38] text-blue-500 focus:ring-0"
                />
              </label>

              {unpackConfig.removeBgColor && (
                <div className="space-y-2 p-2 rounded bg-[#191a22] border border-[#282a36]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">Màu nền:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={unpackConfig.bgKeyColor}
                        onChange={(e) => updateUnpackConfig({ bgKeyColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="font-mono text-[10px] text-zinc-300 uppercase">
                        {unpackConfig.bgKeyColor}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                      <span>Độ lệch màu (Tolerance)</span>
                      <span className="font-mono text-zinc-300">{unpackConfig.colorTolerance}%</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={60}
                      value={unpackConfig.colorTolerance}
                      onChange={(e) =>
                        updateUnpackConfig({ colorTolerance: Number(e.target.value) })
                      }
                      className="w-full accent-blue-500 bg-[#252632] h-1 rounded"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <button
                      onClick={() => updateUnpackConfig({ bgKeyColor: '#ffffff' })}
                      className="px-1.5 py-0.5 bg-[#222430] hover:bg-[#2b2e3e] text-[10px] text-zinc-300 rounded text-center transition"
                    >
                      Trắng
                    </button>
                    <button
                      onClick={() => updateUnpackConfig({ bgKeyColor: '#000000' })}
                      className="px-1.5 py-0.5 bg-[#222430] hover:bg-[#2b2e3e] text-[10px] text-zinc-300 rounded text-center transition"
                    >
                      Đen
                    </button>
                    <button
                      onClick={() => updateUnpackConfig({ bgKeyColor: '#ff00ff' })}
                      className="px-1.5 py-0.5 bg-[#222430] hover:bg-[#2b2e3e] text-[10px] text-zinc-300 rounded text-center transition"
                    >
                      Magenta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===================== PACK (ATLAS) SECTION ===================== */}
        {appMode === 'pack' && (
          <div className="space-y-3">
            {/* PROMINENT ACTION BUTTON: ĐÓNG GÓI ATLAS */}
            <button
              onClick={runPack}
              disabled={frames.length === 0}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm flex items-center justify-center gap-2 text-xs transition"
            >
              <Layers className="w-4 h-4" />
              <span>Đóng Gói Atlas (Pack Atlas)</span>
            </button>

            <div>
              <label className="text-[10px] text-zinc-500">Packing Method</label>
              <select
                value={packConfig.algorithm}
                onChange={(e) =>
                  updatePackConfig({
                    algorithm: e.target.value as 'maxrects-bssf' | 'maxrects-baf' | 'binary-tree',
                  })
                }
                className="w-full mt-0.5 px-2 py-1 bg-[#1e1f26] border border-[#2b2d37] rounded text-zinc-200 text-[11px] focus:outline-none focus:border-blue-500"
              >
                <option value="maxrects-bssf">MaxRects (Best Short Side)</option>
                <option value="maxrects-baf">MaxRects (Best Area Fit)</option>
                <option value="binary-tree">Binary Tree</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500">Padding (px)</label>
                <input
                  type="number"
                  min={0}
                  max={32}
                  value={packConfig.padding}
                  onChange={(e) =>
                    updatePackConfig({ padding: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-full mt-0.5 px-2 py-1 bg-[#1e1f26] border border-[#2b2d37] rounded text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500">Extrude</label>
                <select
                  value={packConfig.extrude}
                  onChange={(e) => updatePackConfig({ extrude: Number(e.target.value) })}
                  className="w-full mt-0.5 px-2 py-1 bg-[#1e1f26] border border-[#2b2d37] rounded text-zinc-200 text-[11px] focus:outline-none focus:border-blue-500"
                >
                  <option value={0}>0px</option>
                  <option value={1}>1px (Bleed Guard)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={packConfig.potLock}
                  onChange={(e) => updatePackConfig({ potLock: e.target.checked })}
                  className="w-3.5 h-3.5 rounded bg-[#1f2027] border-[#2b2d38] text-blue-500 focus:ring-0"
                />
                <span className="text-[11px] text-zinc-400">Power of Two (POT)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={packConfig.trimAlpha}
                  onChange={(e) => updatePackConfig({ trimAlpha: e.target.checked })}
                  className="w-3.5 h-3.5 rounded bg-[#1f2027] border-[#2b2d38] text-blue-500 focus:ring-0"
                />
                <span className="text-[11px] text-zinc-400">Trim Transparency</span>
              </label>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="pt-3 border-t border-[#25262e] text-[11px] space-y-1 text-zinc-400">
          <div className="flex justify-between">
            <span className="text-zinc-500">Tổng Frame:</span>
            <span className="font-mono text-zinc-300">{frames.length}</span>
          </div>
          {selectedFrameIds.length > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Đã chọn:</span>
              <span className="font-mono text-blue-400">{selectedFrameIds.length}</span>
            </div>
          )}
          {atlasResult && appMode === 'pack' && (
            <>
              <div className="flex justify-between">
                <span className="text-zinc-500">Kích thước Atlas:</span>
                <span className="font-mono text-zinc-300">
                  {atlasResult.width}×{atlasResult.height}px
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tỷ lệ lấp đầy:</span>
                <span className="font-mono text-emerald-400">
                  {Math.round(atlasResult.occupancyRate * 100)}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Clean Discreet Ad Container */}
      <div className="p-3 border-t border-[#25262e] bg-[#14151a] flex flex-col items-center">
        <div className="text-[9px] uppercase font-mono tracking-wider text-zinc-600 mb-1">
          Sponsor
        </div>
        <div className="w-full h-32 rounded bg-[#191a21] border border-[#262732] flex flex-col items-center justify-center text-center p-2 text-zinc-500">
          <Box className="w-5 h-5 text-zinc-600 mb-1 stroke-1" />
          <span className="text-[11px] text-zinc-400">AdSense Unit</span>
          <span className="text-[9px] text-zinc-600">300×250</span>
        </div>
      </div>
    </aside>
  );
}
