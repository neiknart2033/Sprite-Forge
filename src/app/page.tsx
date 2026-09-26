'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { LeaderboardAd } from '@/components/ads/LeaderboardAd';
import { LeftToolbar } from '@/components/layout/LeftToolbar';
import { CanvasViewport } from '@/components/canvas/CanvasViewport';
import { AnimationPreview } from '@/components/preview/AnimationPreview';
import { RightPanel } from '@/components/layout/RightPanel';
import { SeoDocumentation } from '@/components/content/SeoDocumentation';

export default function SpriteForgePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#121316] text-zinc-100 selection:bg-blue-500/30 selection:text-white">
      {/* 1. Global Navigation Header */}
      <Header />

      {/* 2. Top Banner (Subtle & Collapsible) */}
      <LeaderboardAd />

      {/* 3. Clean Studio Workspace */}
      <div className="flex flex-1 h-[calc(100vh-100px)] min-h-[560px] border-b border-[#25262e]">
        {/* Minimal Left Toolbar */}
        <LeftToolbar />

        {/* Center Canvas Viewport (Drag & Drop + Slicing/Packing Canvas) */}
        <div className="flex-1 min-w-0 bg-[#121316] relative overflow-hidden">
          <CanvasViewport />
        </div>

        {/* Timeline Preview (Positioned to the right of canvas viewport) */}
        <AnimationPreview />

        {/* Right Inspector Panel */}
        <RightPanel />
      </div>

      {/* 4. Below-the-Fold SEO Landing Zone */}
      <SeoDocumentation />
    </main>
  );
}
