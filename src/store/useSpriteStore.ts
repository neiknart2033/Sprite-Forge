import { create } from 'zustand';
import {
  AnimationConfig,
  AppMode,
  AtlasResult,
  PackConfig,
  SpriteFrame,
  UnpackConfig,
  ViewMode,
} from '@/types';
import { sliceAlphaDetect, sliceUniformGrid } from '@/lib/algorithms/slicer';
import { packSpriteFrames } from '@/lib/algorithms/packer';

interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showBBoxes: boolean;
  showRuler: boolean;
}

interface SpriteStore {
  // App state
  appMode: AppMode;
  viewMode: ViewMode;
  isProcessing: boolean;
  processingProgress: number; // 0 - 100

  // Source assets
  sourceImage: HTMLImageElement | null;
  sourceImageUrl: string | null;
  sourceImageName: string;
  sourceWidth: number;
  sourceHeight: number;

  // Extracted / Imported frames
  frames: SpriteFrame[];
  selectedFrameIds: string[];

  // Atlas result
  atlasResult: AtlasResult | null;

  // Configurations
  unpackConfig: UnpackConfig;
  packConfig: PackConfig;
  animationConfig: AnimationConfig;
  viewport: ViewportState;

  // Actions
  setAppMode: (mode: AppMode) => void;
  setViewMode: (mode: ViewMode) => void;
  loadSourceImage: (file: File) => Promise<void>;
  loadMultipleFrames: (files: File[]) => Promise<void>;
  runUnpack: () => void;
  runPack: () => void;
  updateUnpackConfig: (config: Partial<UnpackConfig>) => void;
  updatePackConfig: (config: Partial<PackConfig>) => void;
  updateAnimationConfig: (config: Partial<AnimationConfig>) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  selectFrame: (id: string, isMulti?: boolean) => void;
  selectAllFrames: () => void;
  clearSelection: () => void;
  removeFrame: (id: string) => void;
  setPivotForSelected: (x: number, y: number) => void;
  resetAll: () => void;
}

let unpackDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let packDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useSpriteStore = create<SpriteStore>((set, get) => ({
  appMode: 'unpack',
  viewMode: 'artist',
  isProcessing: false,
  processingProgress: 0,

  sourceImage: null,
  sourceImageUrl: null,
  sourceImageName: '',
  sourceWidth: 0,
  sourceHeight: 0,

  frames: [],
  selectedFrameIds: [],
  atlasResult: null,

  unpackConfig: {
    mode: 'grid',
    frameWidth: 32,
    frameHeight: 32,
    marginX: 0,
    marginY: 0,
    spacingX: 0,
    spacingY: 0,
    discardEmpty: true,
    alphaThreshold: 10,
    minPixelCount: 4,
    removeBgColor: false,
    bgKeyColor: '#ffffff',
    colorTolerance: 15,
  },

  packConfig: {
    algorithm: 'maxrects-bssf',
    padding: 2,
    extrude: 1,
    potLock: true,
    maxDimension: 4096,
    trimAlpha: true,
    allowRotation: false,
    sortBy: 'max-side',
  },

  animationConfig: {
    fps: 12,
    isPlaying: true,
    currentFrameIndex: 0,
    loop: true,
    pingPong: false,
    zoom: 2,
  },

  viewport: {
    zoom: 1.0,
    panX: 0,
    panY: 0,
    showGrid: true,
    showBBoxes: true,
    showRuler: false,
  },

  setAppMode: (mode) => set({ appMode: mode }),
  setViewMode: (mode) => set({ viewMode: mode }),

  loadSourceImage: async (file: File) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const isJpg = file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name);
        let detectedBg = '#ffffff';

        if (isJpg) {
          const c = document.createElement('canvas');
          c.width = 1;
          c.height = 1;
          const ctx = c.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            detectedBg = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
          }
        }

        set({
          sourceImage: img,
          sourceImageUrl: url,
          sourceImageName: file.name.replace(/\.[^/.]+$/, ''),
          sourceWidth: img.naturalWidth,
          sourceHeight: img.naturalHeight,
          // Auto estimate frame size for grid
          unpackConfig: {
            ...get().unpackConfig,
            removeBgColor: isJpg,
            bgKeyColor: detectedBg,
            frameWidth:
              img.naturalWidth >= 32
                ? img.naturalWidth % 32 === 0
                  ? 32
                  : img.naturalWidth % 16 === 0
                  ? 16
                  : 32
                : img.naturalWidth,
            frameHeight:
              img.naturalHeight >= 32
                ? img.naturalHeight % 32 === 0
                  ? 32
                  : img.naturalHeight % 16 === 0
                  ? 16
                  : 32
                : img.naturalHeight,
          },
          // Center canvas view
          viewport: {
            ...get().viewport,
            panX: 0,
            panY: 0,
            zoom: 1.0,
          },
        });

        // Run automatic slice on load
        get().runUnpack();
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  },

  loadMultipleFrames: async (files: File[]) => {
    const newFrames: SpriteFrame[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.src = url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);
      }

      const frameName = file.name.replace(/\.[^/.]+$/, '');
      newFrames.push({
        id: `imported_${Date.now()}_${i}`,
        name: frameName,
        frame: { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight },
        sourceSize: { w: img.naturalWidth, h: img.naturalHeight },
        pivot: { x: 0.5, y: 1.0 },
        canvas,
        isSelected: false,
      });
    }

    set((state) => ({
      frames: [...state.frames, ...newFrames],
      appMode: 'pack',
    }));

    get().runPack();
  },

  runUnpack: () => {
    const { sourceImage, unpackConfig, sourceImageName } = get();
    if (!sourceImage) return;

    let frames: SpriteFrame[] = [];
    if (unpackConfig.mode === 'grid') {
      frames = sliceUniformGrid(sourceImage, unpackConfig, sourceImageName || 'frame');
    } else {
      frames = sliceAlphaDetect(sourceImage, unpackConfig, sourceImageName || 'sprite');
    }

    set({
      frames,
      selectedFrameIds: frames.length > 0 ? [frames[0].id] : [],
    });

    // If in pack mode, pack right away
    if (get().appMode === 'pack') {
      get().runPack();
    }
  },

  runPack: () => {
    const { frames, packConfig } = get();
    if (frames.length === 0) {
      set({ atlasResult: null });
      return;
    }

    const result = packSpriteFrames(frames, packConfig);
    set({ atlasResult: result });
  },

  updateUnpackConfig: (config) => {
    set((state) => ({
      unpackConfig: { ...state.unpackConfig, ...config },
    }));
    if (unpackDebounceTimer) clearTimeout(unpackDebounceTimer);
    unpackDebounceTimer = setTimeout(() => {
      get().runUnpack();
    }, 120);
  },

  updatePackConfig: (config) => {
    set((state) => ({
      packConfig: { ...state.packConfig, ...config },
    }));
    if (packDebounceTimer) clearTimeout(packDebounceTimer);
    packDebounceTimer = setTimeout(() => {
      get().runPack();
    }, 120);
  },

  updateAnimationConfig: (config) => {
    set((state) => ({
      animationConfig: { ...state.animationConfig, ...config },
    }));
  },

  setViewport: (viewport) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    }));
  },

  selectFrame: (id, isMulti = false) => {
    set((state) => {
      if (!isMulti) {
        return { selectedFrameIds: [id] };
      }
      const exists = state.selectedFrameIds.includes(id);
      return {
        selectedFrameIds: exists
          ? state.selectedFrameIds.filter((fid) => fid !== id)
          : [...state.selectedFrameIds, id],
      };
    });
  },

  selectAllFrames: () => {
    set((state) => ({
      selectedFrameIds: state.frames.map((f) => f.id),
    }));
  },

  clearSelection: () => {
    set({ selectedFrameIds: [] });
  },

  removeFrame: (id) => {
    set((state) => {
      const nextFrames = state.frames.filter((f) => f.id !== id);
      return {
        frames: nextFrames,
        selectedFrameIds: state.selectedFrameIds.filter((fid) => fid !== id),
      };
    });
    if (get().appMode === 'pack') {
      get().runPack();
    }
  },

  setPivotForSelected: (x, y) => {
    set((state) => ({
      frames: state.frames.map((f) =>
        state.selectedFrameIds.includes(f.id)
          ? { ...f, pivot: { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) } }
          : f
      ),
    }));
  },

  resetAll: () => {
    set({
      sourceImage: null,
      sourceImageUrl: null,
      sourceImageName: '',
      sourceWidth: 0,
      sourceHeight: 0,
      frames: [],
      selectedFrameIds: [],
      atlasResult: null,
    });
  },
}));
