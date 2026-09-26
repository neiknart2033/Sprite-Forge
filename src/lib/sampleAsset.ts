/**
 * Generates an authentic pixel art sprite sheet on the fly for immediate testing and demonstration.
 * Creates 4 animated frames (32x32 each = 128x32 total) of a pixel knight character.
 */
export function generateSampleSpriteSheet(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  // Colors
  const skin = '#fcd34d';
  const armor = '#3b82f6';
  const armorDark = '#1d4ed8';
  const sword = '#e2e8f0';
  const eyes = '#0f172a';
  const boots = '#78350f';

  // Draw 4 frames: Idle 1, Idle 2, Walk 1, Walk 2
  for (let frame = 0; frame < 4; frame++) {
    const ox = frame * 32 + 8;
    const oy = 6 + (frame % 2 === 1 ? 1 : 0); // slight bobbing motion

    // Head / Helmet
    ctx.fillStyle = armor;
    ctx.fillRect(ox + 4, oy + 2, 8, 7);

    // Visor / Face
    ctx.fillStyle = skin;
    ctx.fillRect(ox + 6, oy + 5, 5, 3);
    ctx.fillStyle = eyes;
    ctx.fillRect(ox + 8, oy + 6, 2, 2);

    // Helmet plume
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(ox + 5, oy, 6, 2);

    // Body Armor
    ctx.fillStyle = armorDark;
    ctx.fillRect(ox + 3, oy + 9, 10, 8);
    ctx.fillStyle = armor;
    ctx.fillRect(ox + 5, oy + 10, 6, 6);

    // Shield
    ctx.fillStyle = '#64748b';
    ctx.fillRect(ox + 1, oy + 10, 3, 6);

    // Sword
    ctx.fillStyle = sword;
    const swordOffset = frame === 2 ? -2 : frame === 3 ? 1 : 0;
    ctx.fillRect(ox + 13, oy + 7 + swordOffset, 2, 9);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(ox + 12, oy + 12 + swordOffset, 4, 2);

    // Legs / Boots
    ctx.fillStyle = boots;
    if (frame === 2) {
      // Walk 1
      ctx.fillRect(ox + 3, oy + 17, 3, 5);
      ctx.fillRect(ox + 9, oy + 16, 4, 4);
    } else if (frame === 3) {
      // Walk 2
      ctx.fillRect(ox + 4, oy + 16, 4, 4);
      ctx.fillRect(ox + 10, oy + 17, 3, 5);
    } else {
      // Idle
      ctx.fillRect(ox + 4, oy + 17, 3, 5);
      ctx.fillRect(ox + 9, oy + 17, 3, 5);
    }
  }

  return canvas;
}
