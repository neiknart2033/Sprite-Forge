import React from 'react';
import {
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  FileCode2,
  CheckCircle,
} from 'lucide-react';

export function SeoDocumentation() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Sprite-Forge',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All Modern Web Browsers',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Free online 2-in-1 sprite sheet slicer cutter and optimal texture atlas packer with MaxRects 2D bin packing, Power-of-Two clamping, transparent trimming, and 1px extrude texture bleeding guards.',
    featureList: [
      'Automatic Sprite Sheet Slicing with Uniform Grid & Alpha Auto-Detect',
      'Optimal 2D Bin Packing with MaxRects Heuristics',
      'Power-of-Two (POT) Texture Atlas Generation',
      '1px Texture Extrude for WebGL Texture Bleeding Prevention',
      'Phaser 3, PixiJS, Godot 4 .tres, and CSS Sprites Export',
      '100% Client-Side Privacy: Visual assets never leave your device',
    ],
  };

  return (
    <article className="border-t border-zinc-800 bg-zinc-950 text-zinc-300 px-6 py-16">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto space-y-16">
        {/* Hero SEO Intro */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Free Online Sprite Sheet Slicer & Optimal Texture Atlas Packer
          </h1>
          <p className="text-zinc-400 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
            Sprite-Forge is a high-performance, 100% client-side web utility engineered for game
            developers, pixel artists, and 2D animators. Easily split composite sprite sheets into
            standalone frames or pack hundreds of disparate images into a memory-efficient,
            Power-of-Two texture atlas using MaxRects 2D bin packing.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Private (Zero Server Uploads)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cpu className="w-3.5 h-3.5" /> GPU-Ready WebGL Bleed Guards
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="w-3.5 h-3.5" /> Free Texture Packer Alternative
            </span>
          </div>
        </section>

        {/* Feature Comparison / Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">Optimal 2D Bin Packing</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Equipped with the industry-standard <strong>MaxRects (Maximal Rectangles)</strong>{' '}
              algorithm (Best Short Side Fit & Best Area Fit). Achieves &gt;90% packing density to
              minimize GPU VRAM footprint and reduce engine draw calls.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">Alpha Trimming & Pivot Retention</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Strips useless transparent pixels while calculating exact pixel offsets (
              <code>spriteSourceSize</code> vs <code>sourceSize</code>). Reconstruct character
              animations in Godot, Phaser, or PixiJS with zero jitter.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">1px Texture Bleed Guard</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Features automated <strong>1px edge extrude</strong> that replicates bordering
              pixels. Eliminates unsightly color leaking and black seams when using linear filtering
              and mipmaps in WebGL and 3D engines.
            </p>
          </div>
        </div>

        {/* Ad Unit 3: In-Article Native Banner (750x300) */}
        <div className="w-full flex flex-col items-center py-4">
          <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-600 mb-2">
            Sponsored Advertisement
          </div>
          <div className="w-full max-w-3xl h-48 rounded-xl bg-zinc-900 border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500 text-xs">
            <span>In-Article Native Ad Banner (750×300)</span>
            <span className="text-[10px] text-zinc-600 mt-1">High-intent game developer audience</span>
          </div>
        </div>

        {/* In-Depth Step-by-Step Guide */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white">
            How to Slice and Pack Sprite Sheets: Step-by-Step Guide
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed text-zinc-300">
            <div className="space-y-3 p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
              <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-300">
                  1
                </span>
                Slicing a Composite Sprite Sheet (Unpack)
              </h3>
              <p>
                1. Click <strong>Upload Sheet</strong> in the left toolbar or drag and drop your
                composite PNG image.
              </p>
              <p>
                2. Select <strong>Uniform Grid</strong> if frames have fixed widths and heights (e.g.
                32x32, 64x64). Set margins and spacing if your sheet has gutters.
              </p>
              <p>
                3. Select <strong>Alpha Auto-Detect</strong> for irregular or disjoint character
                sprites. Our Connected-Component algorithm will automatically locate discrete
                bounding boxes.
              </p>
              <p>
                4. Preview the animation in the dockable timeline, or export all frames as a single
                ZIP archive.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
              <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-300">
                  2
                </span>
                Packing Frames into an Optimal Atlas (Pack)
              </h3>
              <p>
                1. Switch to <strong>Pack Mode</strong> and upload individual PNG sprites or reuse
                the sliced frames.
              </p>
              <p>
                2. Choose between <strong>MaxRects (BSSF)</strong> or <strong>MaxRects (BAF)</strong>{' '}
                heuristics for maximal surface efficiency.
              </p>
              <p>
                3. Enable <strong>Power-of-Two Lock</strong> if targeting OpenGL / WebGL engines to
                ensure texture sizes conform to 512, 1024, 2048, or 4096 px.
              </p>
              <p>
                4. Click <strong>Export Atlas Bundle</strong> to download the packed image alongside
                ready-to-use metadata for Godot 4 (<code>.tres</code>), Phaser 3 (JSON Hash), or CSS.
              </p>
            </div>
          </div>
        </section>

        {/* Technical FAQ */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-400" /> Frequently Asked Questions (FAQ)
          </h2>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1.5">
              <h3 className="font-semibold text-white">
                Are my game assets or images uploaded to any remote server?
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                <strong>No. Never.</strong> Sprite-Forge is architected as a 100% browser-native
                client-side application. All image processing, canvas operations, and ZIP archiving
                execute locally on your CPU/GPU via HTML5 Canvas and Web APIs. Your confidential
                commercial assets never leave your computer, ensuring strict compliance with studio
                NDAs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1.5">
              <h3 className="font-semibold text-white">
                Why does Power-of-Two (POT) texture sizing matter in game engines?
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                Graphics processing units (GPUs) are architected to optimize texture sampling when
                width and height dimensions are powers of two (e.g. 256, 512, 1024, 2048). POT
                textures enable hardware mipmapping, reduce memory fragmentation, and avoid runtime
                rescaling overhead in engines like Unity, Godot, and Unreal.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1.5">
              <h3 className="font-semibold text-white">
                What causes texture bleeding in WebGL and how does 1px Extrude fix it?
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                When textures are filtered using bilinear or trilinear interpolation, adjacent
                pixels can blend into one another along sprite edges, creating faint discoloration
                or lines. Our 1px Extrude algorithm duplicates the outer pixel perimeter outward,
                providing an authentic color buffer that prevents adjacent sprites from bleeding
                into each other.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Global Footer */}
      <footer className="mt-20 pt-8 border-t border-zinc-800/80 text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} Sprite-Forge. Free Open Web Utility.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-zinc-300 transition">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-zinc-300 transition">
            Terms of Service
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300 transition"
          >
            GitHub
          </a>
        </div>
      </footer>
    </article>
  );
}
