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
    <main className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* 1. Global Navigation Header */}
      <Header />

      {/* 2. Top Leaderboard Banner (AdSense Placement Unit 1) */}
      <LeaderboardAd />

      {/* 3. Core Interactive Workspace */}
      <div className="flex flex-1 h-[calc(100vh-140px)] min-h-[640px] border-b border-zinc-800">
        {/* Left Action Toolbar */}
        <LeftToolbar />

        {/* Center Canvas Viewport & Bottom Animation Timeline */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <CanvasViewport />
          </div>
          <AnimationPreview />
        </div>

        {/* Right Configuration & Metric Panel with Sticky Ad */}
        <RightPanel />
      </div>

      {/* 4. Below-the-Fold SEO Landing Zone & Technical Documentation */}
      <SeoDocumentation />
    </main>
  );
}
