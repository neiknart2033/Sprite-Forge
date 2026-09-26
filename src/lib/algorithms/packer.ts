import { AtlasResult, PackedFrame, PackConfig, Rect, SpriteFrame } from '@/types';
import { calculateTrimBounds, extractFrameCanvas } from './slicer';
import { nextPowerOfTwo } from '@/lib/utils';

/**
 * MaxRects 2D Bin Packing Engine
 */
class MaxRectsBinPacker {
  private binWidth: number;
  private binHeight: number;
  private usedRectangles: Rect[] = [];
  private freeRectangles: Rect[] = [];

  constructor(width: number, height: number) {
    this.binWidth = width;
    this.binHeight = height;
    this.freeRectangles.push({ x: 0, y: 0, w: width, h: height });
  }

  public insert(width: number, height: number, method: 'bssf' | 'baf'): Rect | null {
    let bestNode: Rect | null = null;
    let bestScore1 = Number.MAX_SAFE_INTEGER;
    let bestScore2 = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < this.freeRectangles.length; i++) {
      const free = this.freeRectangles[i];
      if (free.w >= width && free.h >= height) {
        let score1 = 0;
        let score2 = 0;

        if (method === 'bssf') {
          // Best Short Side Fit
          const leftoverHoriz = Math.abs(free.w - width);
          const leftoverVert = Math.abs(free.h - height);
          score1 = Math.min(leftoverHoriz, leftoverVert);
          score2 = Math.max(leftoverHoriz, leftoverVert);
        } else {
          // Best Area Fit
          score1 = free.w * free.h - width * height;
          score2 = Math.min(free.w - width, free.h - height);
        }

        if (score1 < bestScore1 || (score1 === bestScore1 && score2 < bestScore2)) {
          bestScore1 = score1;
          bestScore2 = score2;
          bestNode = { x: free.x, y: free.y, w: width, h: height };
        }
      }
    }

    if (!bestNode) return null;

    this.splitFreeRectangles(bestNode);
    this.pruneFreeRectangles();
    this.usedRectangles.push(bestNode);

    return bestNode;
  }

  private splitFreeRectangles(used: Rect) {
    const nextFree: Rect[] = [];

    for (let i = 0; i < this.freeRectangles.length; i++) {
      const free = this.freeRectangles[i];

      // Check if intersects
      if (
        used.x >= free.x + free.w ||
        used.x + used.w <= free.x ||
        used.y >= free.y + free.h ||
        used.y + used.h <= free.y
      ) {
        nextFree.push(free);
        continue;
      }

      // New rect above
      if (used.y > free.y && used.y < free.y + free.h) {
        nextFree.push({
          x: free.x,
          y: free.y,
          w: free.w,
          h: used.y - free.y,
        });
      }

      // New rect below
      if (used.y + used.h < free.y + free.h) {
        nextFree.push({
          x: free.x,
          y: used.y + used.h,
          w: free.w,
          h: free.y + free.h - (used.y + used.h),
        });
      }

      // New rect on left
      if (used.x > free.x && used.x < free.x + free.w) {
        nextFree.push({
          x: free.x,
          y: free.y,
          w: used.x - free.x,
          h: free.h,
        });
      }

      // New rect on right
      if (used.x + used.w < free.x + free.w) {
        nextFree.push({
          x: used.x + used.w,
          y: free.y,
          w: free.x + free.w - (used.x + used.w),
          h: free.h,
        });
      }
    }

    this.freeRectangles = nextFree;
  }

  private pruneFreeRectangles() {
    for (let i = 0; i < this.freeRectangles.length; i++) {
      for (let j = i + 1; j < this.freeRectangles.length; j++) {
        if (this.isContainedIn(this.freeRectangles[i], this.freeRectangles[j])) {
          this.freeRectangles.splice(i, 1);
          i--;
          break;
        }
        if (this.isContainedIn(this.freeRectangles[j], this.freeRectangles[i])) {
          this.freeRectangles.splice(j, 1);
          j--;
        }
      }
    }
  }

  private isContainedIn(a: Rect, b: Rect): boolean {
    return a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
  }
}

/**
 * 1px Edge Extrude algorithm:
 * Copies the outer perimeter 1 pixel outwards to prevent texture bleeding artifacts in WebGL.
 */
function extrudeFrame(
  targetCtx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  // Draw core image at (dx, dy)
  targetCtx.drawImage(sourceCanvas, dx, dy, dw, dh);

  // Extrude Top & Bottom edges
  targetCtx.drawImage(sourceCanvas, 0, 0, dw, 1, dx, dy - 1, dw, 1);
  targetCtx.drawImage(sourceCanvas, 0, dh - 1, dw, 1, dx, dy + dh, dw, 1);

  // Extrude Left & Right edges
  targetCtx.drawImage(sourceCanvas, 0, 0, 1, dh, dx - 1, dy, 1, dh);
  targetCtx.drawImage(sourceCanvas, dw - 1, 0, 1, dh, dx + dw, dy, 1, dh);

  // Extrude 4 Corners
  targetCtx.drawImage(sourceCanvas, 0, 0, 1, 1, dx - 1, dy - 1, 1, 1);
  targetCtx.drawImage(sourceCanvas, dw - 1, 0, 1, 1, dx + dw, dy - 1, 1, 1);
  targetCtx.drawImage(sourceCanvas, 0, dh - 1, 1, 1, dx - 1, dy + dh, 1, 1);
  targetCtx.drawImage(sourceCanvas, dw - 1, dh - 1, 1, 1, dx + dw, dy + dh, 1, 1);
}

/**
 * Pre-processes frames: trims transparent pixels if requested and preserves anchor/pivot.
 */
function prepareFrames(frames: SpriteFrame[], trimAlpha: boolean): SpriteFrame[] {
  return frames.map((frame) => {
    if (!trimAlpha || !frame.canvas) {
      return frame;
    }

    const ctx = frame.canvas.getContext('2d');
    if (!ctx) return frame;

    const imgData = ctx.getImageData(0, 0, frame.frame.w, frame.frame.h);
    const trim = calculateTrimBounds(imgData, 0, 0, frame.frame.w, frame.frame.h, 0);

    if (trim.isCompletelyEmpty) {
      return frame;
    }

    const trimmedCanvas = extractFrameCanvas(frame.canvas, trim.cropRect);

    return {
      ...frame,
      trimmed: true,
      frame: { x: 0, y: 0, w: trim.cropRect.w, h: trim.cropRect.h },
      spriteSourceSize: trim.spriteSourceSize,
      sourceSize: frame.sourceSize || { w: frame.frame.w, h: frame.frame.h },
      canvas: trimmedCanvas,
    };
  });
}

/**
 * PACK MODULE: Packs an array of SpriteFrames into an optimal Texture Atlas
 */
export function packSpriteFrames(
  inputFrames: SpriteFrame[],
  config: PackConfig
): AtlasResult | null {
  if (!inputFrames || inputFrames.length === 0) return null;

  const { padding, extrude, potLock, algorithm, sortBy, maxDimension } = config;
  const method = algorithm === 'maxrects-baf' ? 'baf' : 'bssf';
  const marginOffset = extrude > 0 ? 1 : 0;
  const spacing = padding + marginOffset * 2;

  // 1. Process Trimming
  const processedFrames = prepareFrames(inputFrames, config.trimAlpha);

  // 2. Pre-sorting
  const sorted = [...processedFrames].sort((a, b) => {
    const aw = a.canvas?.width || a.frame.w;
    const ah = a.canvas?.height || a.frame.h;
    const bw = b.canvas?.width || b.frame.w;
    const bh = b.canvas?.height || b.frame.h;

    switch (sortBy) {
      case 'max-side':
        return Math.max(bw, bh) - Math.max(aw, ah);
      case 'area':
        return bw * bh - aw * ah;
      case 'width':
        return bw - aw;
      case 'height':
        return bh - ah;
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  // 3. Find minimal Atlas dimensions through binary expansion
  let testWidth = 128;
  let testHeight = 128;

  // Estimate total area needed
  const totalArea = sorted.reduce((sum, f) => {
    const w = (f.canvas?.width || f.frame.w) + spacing;
    const h = (f.canvas?.height || f.frame.h) + spacing;
    return sum + w * h;
  }, 0);

  const initialDimension = Math.max(
    64,
    potLock ? nextPowerOfTwo(Math.ceil(Math.sqrt(totalArea))) : Math.ceil(Math.sqrt(totalArea))
  );

  testWidth = initialDimension;
  testHeight = initialDimension;

  let packedFrames: PackedFrame[] = [];
  let success = false;

  while (!success && (testWidth <= maxDimension || testHeight <= maxDimension)) {
    const packer = new MaxRectsBinPacker(testWidth, testHeight);
    let allFitted = true;
    const currentPacked: PackedFrame[] = [];

    for (const frame of sorted) {
      const fw = (frame.canvas?.width || frame.frame.w) + spacing;
      const fh = (frame.canvas?.height || frame.frame.h) + spacing;

      const rect = packer.insert(fw, fh, method);
      if (!rect) {
        allFitted = false;
        break;
      }

      currentPacked.push({
        ...frame,
        packedX: rect.x + marginOffset,
        packedY: rect.y + marginOffset,
        packedW: frame.canvas?.width || frame.frame.w,
        packedH: frame.canvas?.height || frame.frame.h,
      });
    }

    if (allFitted) {
      packedFrames = currentPacked;
      success = true;
      break;
    }

    // Grow dimension
    if (testWidth <= testHeight) {
      testWidth = potLock ? testWidth * 2 : Math.ceil(testWidth * 1.4);
    } else {
      testHeight = potLock ? testHeight * 2 : Math.ceil(testHeight * 1.4);
    }
  }

  if (!success) {
    return null;
  }

  // Calculate actual bounding area
  let maxUsedX = 0;
  let maxUsedY = 0;
  for (const pf of packedFrames) {
    const right = pf.packedX + pf.packedW + marginOffset;
    const bottom = pf.packedY + pf.packedH + marginOffset;
    if (right > maxUsedX) maxUsedX = right;
    if (bottom > maxUsedY) maxUsedY = bottom;
  }

  const finalWidth = potLock ? nextPowerOfTwo(maxUsedX) : Math.max(1, maxUsedX);
  const finalHeight = potLock ? nextPowerOfTwo(maxUsedY) : Math.max(1, maxUsedY);

  // Render to Atlas Canvas
  const atlasCanvas = document.createElement('canvas');
  atlasCanvas.width = finalWidth;
  atlasCanvas.height = finalHeight;
  const atlasCtx = atlasCanvas.getContext('2d', { willReadFrequently: true });

  if (atlasCtx) {
    atlasCtx.imageSmoothingEnabled = false;

    for (const pf of packedFrames) {
      if (!pf.canvas) continue;

      if (extrude > 0) {
        extrudeFrame(atlasCtx, pf.canvas, pf.packedX, pf.packedY, pf.packedW, pf.packedH);
      } else {
        atlasCtx.drawImage(pf.canvas, pf.packedX, pf.packedY, pf.packedW, pf.packedH);
      }
    }
  }

  // Calculate fill rate (occupancy rate)
  const usedPixelArea = packedFrames.reduce((acc, f) => acc + f.packedW * f.packedH, 0);
  const totalCanvasArea = finalWidth * finalHeight;
  const occupancyRate = totalCanvasArea > 0 ? usedPixelArea / totalCanvasArea : 0;

  return {
    canvas: atlasCanvas,
    width: finalWidth,
    height: finalHeight,
    frames: packedFrames,
    occupancyRate,
  };
}
