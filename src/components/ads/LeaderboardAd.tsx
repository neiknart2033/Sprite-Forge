import React from 'react';
import { Box } from 'lucide-react';

export function LeaderboardAd() {
  return (
    <div className="w-full bg-zinc-950 border-b border-zinc-800/80 py-2 px-4 flex flex-col items-center justify-center select-none">
      <div className="text-[9px] uppercase font-mono tracking-widest text-zinc-600 mb-1">
        Advertisement
      </div>
      {/* Responsive Container: 728x90 on Desktop, 320x50 on Mobile */}
      <div className="w-[320px] h-[50px] sm:w-[728px] sm:h-[90px] rounded-lg bg-zinc-900 border border-dashed border-zinc-800 flex items-center justify-center text-zinc-500 gap-2 text-xs">
        <Box className="w-4 h-4 text-zinc-600 stroke-1" />
        <span className="font-medium text-zinc-400">
          Google AdSense Leaderboard (728×90 / 320×50)
        </span>
      </div>
    </div>
  );
}
