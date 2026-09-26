'use client';

import React, { useState } from 'react';
import { Box, ChevronUp, ChevronDown } from 'lucide-react';

export function LeaderboardAd() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="w-full bg-[#131418] border-b border-[#25262e] py-1 px-4 flex flex-col items-center justify-center select-none relative">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-3 top-1 text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5 transition"
        title="Toggle Ad Banner"
      >
        {isCollapsed ? (
          <>
            <span>Show Ad</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </>
        ) : (
          <>
            <span>Hide</span>
            <ChevronUp className="w-2.5 h-2.5" />
          </>
        )}
      </button>

      {!isCollapsed && (
        <div className="w-full max-w-[320px] sm:max-w-[728px] h-[50px] sm:h-[65px] rounded bg-[#181920] border border-[#262732] flex items-center justify-center text-zinc-500 gap-2 text-[11px] my-1">
          <Box className="w-3.5 h-3.5 text-zinc-600 stroke-1" />
          <span className="text-zinc-400 font-medium">AdSense Banner (728×90)</span>
        </div>
      )}
    </div>
  );
}
