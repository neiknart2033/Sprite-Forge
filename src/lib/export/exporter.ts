import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { AtlasResult, PhaserJsonHash, SpriteFrame } from '@/types';

/**
 * Generate standard 32-hex GUID for Unity .meta files
 */
function generateUnityGuid(): string {
  let guid = '';
  const hex = '0123456789abcdef';
  for (let i = 0; i < 32; i++) {
    guid += hex[Math.floor(Math.random() * 16)];
  }
  return guid;
}

/**
 * 1. Export JSON Hash (Phaser 3 / PixiJS standard)
 */
export function generatePhaserJson(
  atlasResult: AtlasResult,
  imageFilename: string = 'spritesheet.png'
): PhaserJsonHash {
  const framesRecord: PhaserJsonHash['frames'] = {};

  for (const pf of atlasResult.frames) {
    const filename = pf.name.endsWith('.png') ? pf.name : `${pf.name}.png`;
    framesRecord[filename] = {
      frame: {
        x: pf.packedX,
        y: pf.packedY,
        w: pf.packedW,
        h: pf.packedH,
      },
      rotated: pf.rotated || false,
      trimmed: pf.trimmed || false,
      spriteSourceSize: pf.spriteSourceSize,
      sourceSize: pf.sourceSize,
      pivot: pf.pivot || { x: 0.5, y: 1.0 },
    };
  }

  return {
    frames: framesRecord,
    meta: {
      app: 'Sprite-Forge',
      version: '1.0.0',
      image: imageFilename,
      format: 'RGBA8888',
      size: { w: atlasResult.width, h: atlasResult.height },
      scale: 1,
    },
  };
}

/**
 * 1b. Export JSON Array (Phaser 3 / PixiJS array format)
 */
export function generatePhaserJsonArray(
  atlasResult: AtlasResult,
  imageFilename: string = 'spritesheet.png'
) {
  const framesArray = atlasResult.frames.map((pf) => {
    const filename = pf.name.endsWith('.png') ? pf.name : `${pf.name}.png`;
    return {
      filename,
      frame: {
        x: pf.packedX,
        y: pf.packedY,
        w: pf.packedW,
        h: pf.packedH,
      },
      rotated: pf.rotated || false,
      trimmed: pf.trimmed || false,
      spriteSourceSize: pf.spriteSourceSize,
      sourceSize: pf.sourceSize,
      pivot: pf.pivot || { x: 0.5, y: 1.0 },
    };
  });

  return {
    frames: framesArray,
    meta: {
      app: 'Sprite-Forge',
      version: '1.0.0',
      image: imageFilename,
      format: 'RGBA8888',
      size: { w: atlasResult.width, h: atlasResult.height },
      scale: 1,
    },
  };
}

/**
 * 2. Export Godot 4 AtlasTexture .tres Resource
 */
export function generateGodotTres(
  atlasResult: AtlasResult,
  imageFilename: string = 'res://spritesheet.png'
): string {
  let content = `[gd_resource type="AtlasTexture" format=3]\n\n`;
  content += `[resource]\n`;
  content += `atlas = ExtResource("${imageFilename}")\n`;

  if (atlasResult.frames.length > 0) {
    const f = atlasResult.frames[0];
    content += `region = Rect2(${f.packedX}, ${f.packedY}, ${f.packedW}, ${f.packedH})\n`;
    if (f.trimmed) {
      content += `margin = Rect2(${f.spriteSourceSize.x}, ${f.spriteSourceSize.y}, ${f.sourceSize.w - f.packedW}, ${f.sourceSize.h - f.packedH})\n`;
    }
  }

  return content;
}

/**
 * 2b. Export Godot 4 SpriteFrames .tres Resource for AnimatedSprite2D
 */
export function generateGodotSpriteFrames(
  atlasResult: AtlasResult,
  imagePath: string = 'res://spritesheet.png',
  fps: number = 12,
  animationName: string = 'default'
): string {
  const frameCount = atlasResult.frames.length;
  let subResources = '';
  const frameEntries: string[] = [];

  for (let i = 0; i < frameCount; i++) {
    const f = atlasResult.frames[i];
    const subId = `AtlasTexture_${i}`;
    subResources += `[sub_resource type="AtlasTexture" id="${subId}"]\n`;
    subResources += `atlas = ExtResource("1_atlas")\n`;
    subResources += `region = Rect2(${f.packedX}, ${f.packedY}, ${f.packedW}, ${f.packedH})\n`;
    if (f.trimmed) {
      const marginX = f.spriteSourceSize.x;
      const marginY = f.spriteSourceSize.y;
      const marginW = f.sourceSize.w - f.packedW;
      const marginH = f.sourceSize.h - f.packedH;
      subResources += `margin = Rect2(${marginX}, ${marginY}, ${marginW}, ${marginH})\n`;
    }
    subResources += `\n`;

    frameEntries.push(`{\n"duration": 1.0,\n"texture": SubResource("${subId}")\n}`);
  }

  return `[gd_resource type="SpriteFrames" load_steps=${frameCount + 2} format=3]

[ext_resource type="Texture2D" path="${imagePath}" id="1_atlas"]

${subResources}[resource]
animations = [{
"frames": [${frameEntries.join(', ')}],
"loop": true,
"name": &"${animationName}",
"speed": ${Math.max(1, fps)}.0
}]
`;
}

/**
 * 3. Export Unity 2D Sprite Sheet .meta File (YAML)
 * Coordinates are mapped to Unity's bottom-left origin
 */
export function generateUnityMeta(
  atlasResult: AtlasResult,
  imageFilename: string = 'spritesheet.png'
): string {
  const fileGuid = generateUnityGuid();
  const texH = atlasResult.height;

  let spritesYaml = '';
  for (let i = 0; i < atlasResult.frames.length; i++) {
    const f = atlasResult.frames[i];
    const spriteGuid = generateUnityGuid();
    const internalId = 21300000 + i * 2;
    // In Unity, (0,0) is bottom-left, y increases upward
    const unityX = f.packedX;
    const unityY = Math.max(0, texH - (f.packedY + f.packedH));
    const pivotX = f.pivot ? f.pivot.x : 0.5;
    const pivotY = f.pivot ? 1.0 - f.pivot.y : 0.0; // In Unity 0 is bottom, 0.5 is center, 1 is top

    spritesYaml += `      - serializedVersion: 2
        name: ${f.name || `frame_${i}`}
        rect:
          serializedVersion: 2
          x: ${unityX}
          y: ${unityY}
          width: ${f.packedW}
          height: ${f.packedH}
        alignment: 9
        pivot: {x: ${pivotX.toFixed(4)}, y: ${pivotY.toFixed(4)}}
        border: {x: 0, y: 0, z: 0, w: 0}
        outline: []
        physicsShape: []
        tessellationDetail: 0
        bones: []
        spriteID: ${spriteGuid}
        internalID: ${internalId}
        vertices: []
        indices: 
        edges: []
        weights: []\n`;
  }

  return `fileFormatVersion: 2
guid: ${fileGuid}
TextureImporter:
  internalIDToNameTable: []
  externalObjects: {}
  serializedVersion: 12
  mipmaps:
    mipMapMode: 0
    enableMipMap: 0
    sRGBTexture: 1
    linearTexture: 0
    fadeOut: 0
    borderMipMap: 0
    mipMapsPreservesCoverage: 0
    alphaTestReferenceValue: 0.5
    mipMapFadeDistanceStart: 1
    mipMapFadeDistanceEnd: 3
  bumpmap:
    convertToNormalMap: 0
    heightScale: 0.25
    normalMapFilter: 0
  isReadable: 0
  streamingMipmaps: 0
  streamingMipmapsPriority: 0
  vTOnly: 0
  ignoreMasterTextureLimit: 0
  grayScaleToAlpha: 0
  generateCubemap: 6
  cubemapConvolution: 0
  seamlessCubemap: 0
  textureFormat: 1
  maxTextureSize: 4096
  textureSettings:
    serializedVersion: 2
    filterMode: 0
    aniso: 1
    mipBias: 0
    wrapU: 1
    wrapV: 1
    wrapW: 1
  nPOTScale: 0
  lightmap: 0
  compressionQuality: 50
  spriteMode: 2
  spriteExtrude: 1
  spriteMeshType: 0
  alignment: 0
  spritePivot: {x: 0.5, y: 0.5}
  spritePixelsToUnits: 100
  spriteBorder: {x: 0, y: 0, z: 0, w: 0}
  spriteGenerateFallbackPhysicsShape: 1
  alphaIsTransparency: 1
  spriteSheet:
    serializedVersion: 2
    sprites:
${spritesYaml}  spritePackingTag: 
  pSDRemoveMatte: 0
  pSDShowRemoveMatteOption: 0
  userData: 
  assetBundleName: 
  assetBundleVariant: 
`;
}

/**
 * 3b. Export Unity Sprite Sheet JSON
 */
export function generateUnityJson(
  atlasResult: AtlasResult,
  imageFilename: string = 'spritesheet.png'
): string {
  const texH = atlasResult.height;
  const sprites = atlasResult.frames.map((f, i) => ({
    name: f.name || `frame_${i}`,
    rect: {
      x: f.packedX,
      y: Math.max(0, texH - (f.packedY + f.packedH)),
      width: f.packedW,
      height: f.packedH,
    },
    pivot: {
      x: f.pivot ? Number(f.pivot.x.toFixed(4)) : 0.5,
      y: f.pivot ? Number((1.0 - f.pivot.y).toFixed(4)) : 0.0,
    },
  }));

  return JSON.stringify(
    {
      texture: imageFilename,
      width: atlasResult.width,
      height: atlasResult.height,
      sprites,
    },
    null,
    2
  );
}

/**
 * 4. Export CSV Format for Generic Engines (Raylib, LÖVE 2D, Pygame, C++)
 */
export function generateCsvData(atlasResult: AtlasResult): string {
  let csv = 'name,x,y,width,height,pivot_x,pivot_y\n';
  for (let i = 0; i < atlasResult.frames.length; i++) {
    const f = atlasResult.frames[i];
    const name = f.name || `frame_${i}`;
    const px = f.pivot ? f.pivot.x.toFixed(3) : '0.500';
    const py = f.pivot ? f.pivot.y.toFixed(3) : '1.000';
    csv += `"${name}",${f.packedX},${f.packedY},${f.packedW},${f.packedH},${px},${py}\n`;
  }
  return csv;
}

/**
 * 5. Export CSS Spritesheet Styles
 */
export function generateCssSprites(
  atlasResult: AtlasResult,
  imageFilename: string = 'spritesheet.png'
): string {
  let css = `/* Generated by Sprite-Forge */\n`;
  css += `.sprite {\n  display: inline-block;\n  background-image: url('${imageFilename}');\n  background-repeat: no-repeat;\n}\n\n`;

  for (const pf of atlasResult.frames) {
    const className = pf.name.replace(/[^a-zA-Z0-9_-]/g, '-');
    css += `.${className} {\n`;
    css += `  width: ${pf.packedW}px;\n`;
    css += `  height: ${pf.packedH}px;\n`;
    css += `  background-position: -${pf.packedX}px -${pf.packedY}px;\n`;
    css += `}\n`;
  }

  return css;
}

/**
 * 6. Export All Frames as a ZIP Bundle
 */
export async function downloadFramesZip(
  frames: SpriteFrame[],
  zipFilename: string = 'sprite_frames.zip'
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    if (!frame.canvas) continue;

    const base64Data = frame.canvas.toDataURL('image/png').split(',')[1];
    const filename = `${frame.name || `frame_${String(i).padStart(3, '0')}`}.png`;
    zip.file(filename, base64Data, { base64: true });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipFilename);
}

/**
 * 7. Download Unity Bundle (.png + .png.meta + .json + README)
 */
export async function downloadUnityBundle(
  atlasResult: AtlasResult,
  baseName: string = 'spritesheet'
): Promise<void> {
  const zip = new JSZip();

  // 1. Texture PNG
  const pngBase64 = atlasResult.canvas.toDataURL('image/png').split(',')[1];
  zip.file(`${baseName}.png`, pngBase64, { base64: true });

  // 2. Unity .meta file
  const metaContent = generateUnityMeta(atlasResult, `${baseName}.png`);
  zip.file(`${baseName}.png.meta`, metaContent);

  // 3. Unity Sprite JSON
  const jsonContent = generateUnityJson(atlasResult, `${baseName}.png`);
  zip.file(`${baseName}_sprites.json`, jsonContent);

  // 4. Readme instructions
  const readme = `Unity 2D Sprite Sheet Bundle - Generated by Sprite-Forge
=======================================================
How to use in Unity:
1. Drag both "${baseName}.png" and "${baseName}.png.meta" into your Unity project Assets folder (e.g. Assets/Sprites/).
2. Unity will automatically detect the sprite sheet, set Sprite Mode to "Multiple", and import all sliced sprites with custom bounds and pivots.
3. You can also view or parse "${baseName}_sprites.json" via JsonUtility or your custom importer script.
`;
  zip.file(`README_UNITY.txt`, readme);

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${baseName}_unity_bundle.zip`);
}

/**
 * 8. Download Godot 4 Bundle (.png + SpriteFrames .tres + AtlasTexture .tres + README)
 */
export async function downloadGodotBundle(
  atlasResult: AtlasResult,
  baseName: string = 'spritesheet',
  fps: number = 12
): Promise<void> {
  const zip = new JSZip();

  // 1. Texture PNG
  const pngBase64 = atlasResult.canvas.toDataURL('image/png').split(',')[1];
  zip.file(`${baseName}.png`, pngBase64, { base64: true });

  // 2. Godot 4 SpriteFrames resource (.tres)
  const spriteFrames = generateGodotSpriteFrames(
    atlasResult,
    `res://${baseName}.png`,
    fps,
    'default'
  );
  zip.file(`${baseName}_sprite_frames.tres`, spriteFrames);

  // 3. Single AtlasTexture resource (.tres)
  const atlasTres = generateGodotTres(atlasResult, `res://${baseName}.png`);
  zip.file(`${baseName}_atlas.tres`, atlasTres);

  // 4. Readme instructions
  const readme = `Godot 4 2D Sprite Bundle - Generated by Sprite-Forge
===================================================
How to use in Godot 4:
1. Copy "${baseName}.png" and "${baseName}_sprite_frames.tres" into your Godot project (e.g. res://sprites/).
2. Create an AnimatedSprite2D node in your scene.
3. In the Inspector, drag "${baseName}_sprite_frames.tres" into the "Sprite Frames" property.
4. Set Animation to "default" and click Play!
`;
  zip.file(`README_GODOT.txt`, readme);

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${baseName}_godot_bundle.zip`);
}

/**
 * 9. Download Universal Bundle (All Engine formats in a single ZIP)
 */
export async function downloadUniversalBundle(
  atlasResult: AtlasResult,
  baseName: string = 'spritesheet',
  fps: number = 12
): Promise<void> {
  const zip = new JSZip();

  // 1. Texture PNG
  const pngBase64 = atlasResult.canvas.toDataURL('image/png').split(',')[1];
  zip.file(`${baseName}.png`, pngBase64, { base64: true });

  // 2. Unity .meta & JSON
  zip.file(`${baseName}.png.meta`, generateUnityMeta(atlasResult, `${baseName}.png`));
  zip.file(`${baseName}_unity.json`, generateUnityJson(atlasResult, `${baseName}.png`));

  // 3. Godot 4 SpriteFrames & AtlasTexture
  zip.file(
    `${baseName}_godot_frames.tres`,
    generateGodotSpriteFrames(atlasResult, `res://${baseName}.png`, fps, 'default')
  );
  zip.file(`${baseName}_godot_atlas.tres`, generateGodotTres(atlasResult, `res://${baseName}.png`));

  // 4. Phaser / PixiJS JSON
  zip.file(
    `${baseName}_phaser.json`,
    JSON.stringify(generatePhaserJson(atlasResult, `${baseName}.png`), null, 2)
  );

  // 5. CSS Spritesheet
  zip.file(`${baseName}.css`, generateCssSprites(atlasResult, `${baseName}.png`));

  // 6. CSV Data
  zip.file(`${baseName}.csv`, generateCsvData(atlasResult));

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${baseName}_all_engines_bundle.zip`);
}

/**
 * 10. Download Standard Atlas Bundle (PNG + JSON + Godot tres + CSS)
 */
export async function downloadAtlasZip(
  atlasResult: AtlasResult,
  baseName: string = 'spritesheet'
): Promise<void> {
  const zip = new JSZip();

  // 1. Atlas PNG
  const pngBase64 = atlasResult.canvas.toDataURL('image/png').split(',')[1];
  zip.file(`${baseName}.png`, pngBase64, { base64: true });

  // 2. Phaser/PixiJS JSON
  const jsonMetadata = generatePhaserJson(atlasResult, `${baseName}.png`);
  zip.file(`${baseName}.json`, JSON.stringify(jsonMetadata, null, 2));

  // 3. Godot 4 .tres
  const godotTres = generateGodotTres(atlasResult, `res://${baseName}.png`);
  zip.file(`${baseName}.tres`, godotTres);

  // 4. CSS Spritesheet
  const css = generateCssSprites(atlasResult, `${baseName}.png`);
  zip.file(`${baseName}.css`, css);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${baseName}_atlas_bundle.zip`);
}

/**
 * 11. Export Animated GIF using gifenc
 */
export async function generateAndDownloadGif(
  frames: SpriteFrame[],
  fps: number = 12,
  gifFilename: string = 'animation.gif'
): Promise<void> {
  if (frames.length === 0) return;

  const validFrames = frames.filter((f) => !!f.canvas);
  if (validFrames.length === 0) return;

  // Find max canvas dimensions
  const maxW = Math.max(...validFrames.map((f) => f.canvas!.width));
  const maxH = Math.max(...validFrames.map((f) => f.canvas!.height));

  const gif = GIFEncoder();
  const delayMs = Math.round(1000 / fps);

  const helperCanvas = document.createElement('canvas');
  helperCanvas.width = maxW;
  helperCanvas.height = maxH;
  const helperCtx = helperCanvas.getContext('2d', { willReadFrequently: true });
  if (!helperCtx) return;

  for (const frame of validFrames) {
    helperCtx.clearRect(0, 0, maxW, maxH);
    const offsetX = Math.floor((maxW - frame.canvas!.width) / 2);
    const offsetY = Math.floor((maxH - frame.canvas!.height) / 2);
    helperCtx.drawImage(frame.canvas!, offsetX, offsetY);

    const { data } = helperCtx.getImageData(0, 0, maxW, maxH);

    // Quantize RGBA to 256 colors
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);

    gif.writeFrame(index, maxW, maxH, {
      palette,
      delay: delayMs,
      transparent: true,
      transparentIndex: 0,
    });
  }

  gif.finish();
  const buffer = gif.bytes();
  const blob = new Blob([buffer as unknown as BlobPart], { type: 'image/gif' });
  saveAs(blob, gifFilename);
}
