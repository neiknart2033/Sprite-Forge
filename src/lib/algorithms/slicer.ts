import { Rect, SpriteFrame, UnpackConfig } from '@/types';

/**
 * Checks if a rectangular region in ImageData has non-transparent pixels above threshold.
 */
function hasVisiblePixels(
  imageData: ImageData,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  alphaThreshold: number
): boolean {
  const data = imageData.data;
  const imgW = imageData.width;

  for (let y = ry; y < ry + rh; y++) {
    const rowOffset = y * imgW * 4;
    for (let x = rx; x < rx + rw; x++) {
      const alpha = data[rowOffset + x * 4 + 3];
      if (alpha > alphaThreshold) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Calculates trimmed bounds for a frame, stripping transparent edges.
 */
export function calculateTrimBounds(
  imageData: ImageData,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  alphaThreshold: number = 0
): {
  isCompletelyEmpty: boolean;
  cropRect: Rect;
  spriteSourceSize: Rect;
  sourceSize: { w: number; h: number };
} {
  const data = imageData.data;
  const imgW = imageData.width;

  let minX = rw;
  let minY = rh;
  let maxX = -1;
  let maxY = -1;

  for (let localY = 0; localY < rh; localY++) {
    const globalY = ry + localY;
    const rowOffset = globalY * imgW * 4;

    for (let localX = 0; localX < rw; localX++) {
      const globalX = rx + localX;
      const alpha = data[rowOffset + globalX * 4 + 3];

      if (alpha > alphaThreshold) {
        if (localX < minX) minX = localX;
        if (localX > maxX) maxX = localX;
        if (localY < minY) minY = localY;
        if (localY > maxY) maxY = localY;
      }
    }
  }

  if (maxX === -1) {
    return {
      isCompletelyEmpty: true,
      cropRect: { x: rx, y: ry, w: rw, h: rh },
      spriteSourceSize: { x: 0, y: 0, w: rw, h: rh },
      sourceSize: { w: rw, h: rh },
    };
  }

  const croppedW = maxX - minX + 1;
  const croppedH = maxY - minY + 1;

  return {
    isCompletelyEmpty: false,
    cropRect: {
      x: rx + minX,
      y: ry + minY,
      w: croppedW,
      h: croppedH,
    },
    spriteSourceSize: {
      x: minX,
      y: minY,
      w: croppedW,
      h: croppedH,
    },
    sourceSize: {
      w: rw,
      h: rh,
    },
  };
}

/**
 * Creates an offscreen HTMLCanvasElement containing a cropped frame.
 */
export function extractFrameCanvas(
  sourceCanvas: HTMLCanvasElement | HTMLImageElement,
  frameRect: Rect
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, frameRect.w);
  canvas.height = Math.max(1, frameRect.h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sourceCanvas,
      frameRect.x,
      frameRect.y,
      frameRect.w,
      frameRect.h,
      0,
      0,
      frameRect.w,
      frameRect.h
    );
  }
  return canvas;
}

/**
 * 1. UNPACK: Uniform Grid Mode
 */
export function sliceUniformGrid(
  source: HTMLCanvasElement | HTMLImageElement,
  config: UnpackConfig,
  baseName: string = 'frame'
): SpriteFrame[] {
  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  // Render to temporary canvas to read pixel data
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);
  const frames: SpriteFrame[] = [];

  const { frameWidth, frameHeight, marginX, marginY, spacingX, spacingY, discardEmpty, alphaThreshold } =
    config;

  if (frameWidth <= 0 || frameHeight <= 0) return [];

  let index = 0;
  for (let y = marginY; y + frameHeight <= height; y += frameHeight + spacingY) {
    for (let x = marginX; x + frameWidth <= width; x += frameWidth + spacingX) {
      if (discardEmpty) {
        const isVisible = hasVisiblePixels(imageData, x, y, frameWidth, frameHeight, alphaThreshold);
        if (!isVisible) continue;
      }

      const frameId = `frame_${String(index).padStart(3, '0')}`;
      const frameRect: Rect = { x, y, w: frameWidth, h: frameHeight };
      const frameCanvas = extractFrameCanvas(tempCanvas, frameRect);

      frames.push({
        id: frameId,
        name: `${baseName}_${String(index).padStart(3, '0')}`,
        frame: frameRect,
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
        sourceSize: { w: frameWidth, h: frameHeight },
        pivot: { x: 0.5, y: 1.0 }, // Standard 2D game bottom-center anchor
        canvas: frameCanvas,
        dataUrl: frameCanvas.toDataURL('image/png'),
        isSelected: false,
      });

      index++;
    }
  }

  return frames;
}

/**
 * 2. UNPACK: Alpha Auto-Detection Mode using Connected-Component Labeling (BFS)
 */
export function sliceAlphaDetect(
  source: HTMLCanvasElement | HTMLImageElement,
  config: UnpackConfig,
  baseName: string = 'sprite'
): SpriteFrame[] {
  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const visited = new Uint8Array(width * height);
  const { alphaThreshold, minPixelCount } = config;

  const boundingBoxes: Rect[] = [];

  // Breadth-First Search queue
  const queue = new Int32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) continue;

      const alpha = data[idx * 4 + 3];
      if (alpha <= alphaThreshold) {
        visited[idx] = 1;
        continue;
      }

      // Found a new unvisited foreground pixel: start BFS
      let qHead = 0;
      let qTail = 0;
      queue[qTail++] = idx;
      visited[idx] = 1;

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let pixelCount = 0;

      while (qHead < qTail) {
        const curIdx = queue[qHead++];
        const curY = Math.floor(curIdx / width);
        const curX = curIdx % width;
        pixelCount++;

        if (curX < minX) minX = curX;
        if (curX > maxX) maxX = curX;
        if (curY < minY) minY = curY;
        if (curY > maxY) maxY = curY;

        // 8-way connectivity for connected sprites
        for (let dy = -1; dy <= 1; dy++) {
          const ny = curY + dy;
          if (ny < 0 || ny >= height) continue;

          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = curX + dx;
            if (nx < 0 || nx >= width) continue;

            const nIdx = ny * width + nx;
            if (!visited[nIdx]) {
              visited[nIdx] = 1;
              if (data[nIdx * 4 + 3] > alphaThreshold) {
                queue[qTail++] = nIdx;
              }
            }
          }
        }
      }

      if (pixelCount >= (minPixelCount || 4)) {
        boundingBoxes.push({
          x: minX,
          y: minY,
          w: maxX - minX + 1,
          h: maxY - minY + 1,
        });
      }
    }
  }

  // Sort bounding boxes top-to-bottom, left-to-right
  boundingBoxes.sort((a, b) => {
    const rowDiff = Math.abs(a.y - b.y);
    if (rowDiff > 16) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  const frames: SpriteFrame[] = [];
  boundingBoxes.forEach((rect, i) => {
    const frameId = `sprite_${String(i).padStart(3, '0')}`;
    const frameCanvas = extractFrameCanvas(tempCanvas, rect);

    frames.push({
      id: frameId,
      name: `${baseName}_${String(i).padStart(3, '0')}`,
      frame: rect,
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: rect.w, h: rect.h },
      sourceSize: { w: rect.w, h: rect.h },
      pivot: { x: 0.5, y: 1.0 },
      canvas: frameCanvas,
      dataUrl: frameCanvas.toDataURL('image/png'),
      isSelected: false,
    });
  });

  return frames;
}
