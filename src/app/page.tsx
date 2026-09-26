'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { LeaderboardAd } from '@/components/ads/LeaderboardAd';
import { LeftToolbar } from '@/components/layout/LeftToolbar';
import { CanvasViewport } from '@/components/canvas/CanvasViewport';
import { AnimationPreview } from '@/components/preview/AnimationPreview';
import { RightPanel } from '@/components/layout/RightPanel';
import { ExportModal } from '@/components/export/ExportModal';
import { SeoDocumentation } from '@/components/content/SeoDocumentation';
import { useSpriteStore } from '@/store/useSpriteStore';
import { Eye, Film, Sliders } from 'lucide-react';

export default function SpriteForgePage() {
  const { frames, isExportModalOpen, closeExportModal, exportModalTarget } = useSpriteStore();

  // Tablet (< xl, >= md): Switch between Results/Anim and Inspector in single right sidebar
  const [tabletSideTab, setTabletSideTab] = useState<'preview' | 'inspector'>('preview');

  // Mobile (< md): Switch between Canvas, Results/Anim, and Inspector
  const [mobileTab, setMobileTab] = useState<'canvas' | 'results' | 'inspector'>('canvas');

  return (
    <main className="min-h-screen flex flex-col bg-[#121316] text-zinc-100 selection:bg-blue-500/30 selection:text-white">
      {/* 1. Global Navigation Header */}
      <Header />

      {/* 2. Top Banner (Subtle & Collapsible) */}
      <LeaderboardAd />

      {/* 3. Clean Studio Workspace (strictly bounded height with min-h-0 and max-h to prevent page elongation) */}
      <div className="flex flex-1 h-[calc(100vh-100px)] min-h-[500px] max-h-[calc(100vh-100px)] min-h-0 overflow-hidden border-b border-[#25262e] relative">
        {/* Minimal Left Toolbar (Visible on desktop/tablet, or on mobile when Canvas tab active) */}
        <div className={`${mobileTab === 'canvas' ? 'flex' : 'hidden md:flex'} h-full shrink-0`}>
          <LeftToolbar />
        </div>

        {/* Center Canvas Viewport */}
        <div
          className={`flex-1 min-w-0 h-full bg-[#121316] relative overflow-hidden ${
            mobileTab === 'canvas' ? 'flex flex-col' : 'hidden md:flex flex-col'
          }`}
        >
          <CanvasViewport />
        </div>

        {/* Desktop View (xl: >= 1280px): Show BOTH side panels side-by-side */}
        <div className="hidden xl:flex h-full shrink-0">
          <AnimationPreview standalone={true} />
          <RightPanel />
        </div>

        {/* Tablet View (md to xl: 768px - 1279px): Single Right Sidebar with dual tabs */}
        <div className="hidden md:flex xl:hidden flex-col h-full max-h-full min-h-0 border-l border-[#25262e] bg-[#16171c] shrink-0">
          {/* Dual Tab Header */}
          <div className="shrink-0 flex items-center p-1 bg-[#14151a] border-b border-[#25262e] gap-1 text-xs">
            <button
              onClick={() => setTabletSideTab('preview')}
              className={`flex-1 py-1 px-2 rounded font-medium flex items-center justify-center gap-1.5 transition ${
                tabletSideTab === 'preview'
                  ? 'bg-[#252838] text-blue-400 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Results & Anim ({frames.length})</span>
            </button>

            <button
              onClick={() => setTabletSideTab('inspector')}
              className={`flex-1 py-1 px-2 rounded font-medium flex items-center justify-center gap-1.5 transition ${
                tabletSideTab === 'inspector'
                  ? 'bg-[#252838] text-blue-400 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 min-h-0 max-h-full overflow-hidden flex flex-col">
            {tabletSideTab === 'preview' ? (
              <AnimationPreview standalone={false} />
            ) : (
              <RightPanel />
            )}
          </div>
        </div>

        {/* Mobile Views (< md: < 768px): Full screen view for active tab */}
        {mobileTab === 'results' && (
          <div className="flex md:hidden flex-1 h-full max-h-full min-h-0 flex-col overflow-hidden pb-12">
            <AnimationPreview standalone={false} />
          </div>
        )}

        {mobileTab === 'inspector' && (
          <div className="flex md:hidden flex-1 h-full max-h-full min-h-0 flex-col overflow-hidden pb-12">
            <RightPanel />
          </div>
        )}

        {/* Mobile Bottom Dock Navigation Bar (< md) */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 h-11 bg-[#14151b] border-t border-[#25262e] flex items-center justify-around z-50 text-[11px]">
          <button
            onClick={() => setMobileTab('canvas')}
            className={`flex flex-col items-center justify-center py-1 flex-1 transition ${
              mobileTab === 'canvas' ? 'text-blue-400 font-medium' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Eye className="w-4 h-4 mb-0.5" />
            <span>Canvas</span>
          </button>

          <button
            onClick={() => setMobileTab('results')}
            className={`flex flex-col items-center justify-center py-1 flex-1 transition relative ${
              mobileTab === 'results' ? 'text-blue-400 font-medium' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Film className="w-4 h-4 mb-0.5" />
            <span>Results ({frames.length})</span>
            {frames.length > 0 && (
              <span className="absolute top-1 right-1/4 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setMobileTab('inspector')}
            className={`flex flex-col items-center justify-center py-1 flex-1 transition ${
              mobileTab === 'inspector' ? 'text-blue-400 font-medium' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sliders className="w-4 h-4 mb-0.5" />
            <span>Inspector</span>
          </button>
        </div>
      </div>

      {/* 4. Below-the-Fold SEO Landing Zone */}
      <SeoDocumentation />

      {/* 5. Game Engine Export Modal (Unity, Godot, Phaser, etc.) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={closeExportModal}
        defaultTarget={exportModalTarget}
      />
    </main>
  );
}
