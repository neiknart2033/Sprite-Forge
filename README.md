# Sprite-Forge (Online 2-in-1 Sprite Slicer & Optimal Atlas Packer)

> **Free Web Utility (Ad-Supported & Google AdSense Optimized)**
> **Architecture:** 100% Client-Side (Zero Server Overhead / Static Deployment)
> **Target Audience:** Game Developers, Programmers, Pixel Artists, & 2D Animators

---

## ⚡ Overview

**Sprite-Forge** is an open, browser-native toolkit that bridges the gap between game programmers and 2D visual artists:

1. **UNPACK (Slicing):** Split composite sprite sheets into standalone frames via:
   - **Uniform Grid Mode:** Slicing with customizable width, height, spacing, margins, and transparent frame discarding.
   - **Alpha Auto-Detect Mode:** Automated Breadth-First Search (BFS) / Connected-Component Labeling (CCL) scanning pixel clusters with configurable alpha thresholds.
2. **PACK (Texture Atlas Packing):** Pack heterogeneous frames into a compact texture atlas:
   - **MaxRects 2D Bin Packing:** Heuristics with Best Short Side Fit (BSSF) and Best Area Fit (BAF) reaching >90% fill rate.
   - **Power-of-Two (POT) Clamping:** Automatic clamping to 512, 1024, 2048, 4096 px for GPU VRAM optimization.
   - **1px Texture Extrude:** Duplicate outer edge pixels outward by 1px to eliminate WebGL texture bleeding artifacts during linear filtering and mipmapping.
   - **Alpha Trimming with Anchor Retention:** Strip empty space while preserving offset coordinates (`spriteSourceSize` vs `sourceSize`) so game engines reconstruct animations without jitter.

---

## 🚀 Supported Export Engines & Formats

- **Phaser 3 / PixiJS:** Standard JSON Hash metadata with trim offsets and pivot points.
- **Godot 4:** Native `AtlasTexture` resource mapping (`.tres`).
- **Web CSS Sprites:** CSS class definitions with `background-position`.
- **ZIP Bundles:** Complete multi-asset bundles containing the packed PNG atlas + all metadata formats.
- **Raw Frames (ZIP):** Individual standalone `frame_000.png` images.
- **Animated GIF:** Fast, high-quality client-side GIF loops via `gifenc`.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Export Mode:** 100% Static HTML/CSS/JS export (`output: 'export'`)
- **Styling & UI:** Tailwind CSS, Radix UI Primitives, Lucide Icons
- **State Management:** Zustand
- **Rendering Engine:** Native Canvas Context 2D with `image-rendering: pixelated`
- **Archiving & Encoders:** JSZip, FileSaver, gifenc

---

## 💻 Development & Build

### Development Server
```bash
npm run dev
```

### Static Production Build
```bash
npm run build
```
The static export files will be generated in the `out/` directory, ready to deploy to Cloudflare Pages, Vercel, Netlify, or GitHub Pages at zero ongoing hosting cost.
