export type AppMode = 'unpack' | 'pack';
export type ViewMode = 'artist' | 'developer';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SpriteFrame {
  id: string;
  name: string;
  // Bounding box in source image
  frame: Rect;
  rotated: boolean;
  trimmed: boolean;
  // Position and size relative to untrimmed canvas
  spriteSourceSize: Rect;
  // Original frame size
  sourceSize: { w: number; h: number };
  pivot: Point;
  // Cached frame visual data URL or canvas
  canvas?: HTMLCanvasElement;
  dataUrl?: string;
  isSelected?: boolean;
}

export interface PackedFrame extends SpriteFrame {
  packedX: number;
  packedY: number;
  packedW: number;
  packedH: number;
}

export interface AtlasResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  frames: PackedFrame[];
  occupancyRate: number; // 0.0 - 1.0 (fill rate)
}

export interface UnpackConfig {
  mode: 'grid' | 'alpha';
  frameWidth: number;
  frameHeight: number;
  marginX: number;
  marginY: number;
  spacingX: number;
  spacingY: number;
  discardEmpty: boolean;
  alphaThreshold: number; // 0 - 255
  minPixelCount: number; // Minimum pixels to count as sprite
  removeBgColor: boolean; // For JPG and solid background sprite sheets
  bgKeyColor: string; // Hex color like '#ffffff' or '#000000'
  colorTolerance: number; // 0 - 100
}

export interface PackConfig {
  algorithm: 'maxrects-bssf' | 'maxrects-baf' | 'binary-tree';
  padding: number;
  extrude: number; // 0 or 1px
  potLock: boolean; // Power of two dimensions
  maxDimension: number;
  trimAlpha: boolean;
  allowRotation: boolean;
  sortBy: 'max-side' | 'area' | 'width' | 'height' | 'name';
}

export interface AnimationConfig {
  fps: number;
  isPlaying: boolean;
  currentFrameIndex: number;
  loop: boolean;
  pingPong: boolean;
  zoom: number;
}

export interface PhaserJsonHash {
  frames: Record<
    string,
    {
      frame: Rect;
      rotated: boolean;
      trimmed: boolean;
      spriteSourceSize: Rect;
      sourceSize: { w: number; h: number };
      pivot: Point;
    }
  >;
  meta: {
    app: string;
    version: string;
    image: string;
    format: string;
    size: { w: number; h: number };
    scale: number;
  };
}
