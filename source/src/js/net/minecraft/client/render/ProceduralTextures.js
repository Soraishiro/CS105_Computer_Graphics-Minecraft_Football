/**
 * ProceduralTextures — eight 16×16 Canvas2D-drawn tiles used to clad the
 * stadium tunnel. Each draw function paints onto a fresh 16×16 canvas and
 * returns the canvas. The atlas-stitch step in Start.js then composites each
 * canvas onto the terrain_stadium.png atlas at its assigned slot.
 *
 * No external PNG assets are needed — the pixel art lives in code so it's
 * fully version-controlled and tweakable. Each function is intentionally
 * simple: solid bases plus a few accents. The textures are designed to be
 * legible at distance and tile cleanly along axes.
 */

const TILE = 16;

function makeCanvas() {
  const c = document.createElement("canvas");
  c.width = TILE;
  c.height = TILE;
  return c;
}

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function fillRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/* ---------------------------------------------------------------- */
/* Slot 242 — TUNNEL_GLASS_PANEL                                    */
/* Frosted-blue tinted glass with a thin metallic frame.            */
/* ---------------------------------------------------------------- */
function drawGlassPanel() {
  const c = makeCanvas();
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(160, 200, 230, 0.45)";
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.fillStyle = "#2a3a4a";
  ctx.fillRect(0, 0, TILE, 1);
  ctx.fillRect(0, TILE - 1, TILE, 1);
  ctx.fillRect(0, 0, 1, TILE);
  ctx.fillRect(TILE - 1, 0, 1, TILE);
  for (let i = 0; i < 6; i++) {
    px(ctx, 2 + i, 2 + i, "rgba(255, 255, 255, 0.45)");
  }
  return c;
}

/* ---------------------------------------------------------------- */
/* Slot 243 — TUNNEL_MARBLE_FLOOR                                   */
/* Cream base with subtle vein lines.                               */
/* ---------------------------------------------------------------- */
function drawMarbleFloor() {
  const c = makeCanvas();
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#e6e1d3";
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 24; i++) {
    const x = (i * 7) % TILE;
    const y = (i * 13) % TILE;
    px(ctx, x, y, "#d8d2c0");
  }
  ctx.strokeStyle = "#b8b0a0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(6, 5);
  ctx.lineTo(11, 3);
  ctx.lineTo(TILE, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 11);
  ctx.lineTo(5, 10);
  ctx.lineTo(10, 13);
  ctx.lineTo(TILE, 12);
  ctx.stroke();
  fillRect(ctx, 0, TILE - 1, TILE, 1, "#c8c0b0");
  fillRect(ctx, TILE - 1, 0, 1, TILE, "#c8c0b0");
  return c;
}

/* ---------------------------------------------------------------- */
/* Slot 244 — TUNNEL_RED_CARPET                                     */
/* ---------------------------------------------------------------- */
function drawRedCarpet() {
  const c = makeCanvas();
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#a8141e";
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.fillStyle = "#c8202e";
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if ((x + y) % 4 === 0) px(ctx, x, y, "#c8202e");
    }
  }
  ctx.fillStyle = "#8a0c16";
  for (let i = 0; i < 18; i++) {
    const x = (i * 5 + 3) % TILE;
    const y = (i * 11 + 1) % TILE;
    px(ctx, x, y, "#8a0c16");
  }
  fillRect(ctx, 0, 0, TILE, 1, "#601018");
  fillRect(ctx, 0, TILE - 1, TILE, 1, "#601018");
  return c;
}

/* ---------------------------------------------------------------- */
/* Slot 245 — TUNNEL_ARCH_SEGMENT                                   */
/* ---------------------------------------------------------------- */
function drawArchSegment() {
  const c = makeCanvas();
  const ctx = c.getContext("2d");
  for (let y = 0; y < TILE; y++) {
    const t = y / TILE;
    const shade = Math.floor(0x32 + t * 0x35);
    const hex = shade.toString(16).padStart(2, "0");
    fillRect(ctx, 0, y, TILE, 1, `#${hex}${hex}${hex}`);
  }
  ctx.fillStyle = "#a0a8b8";
  for (let x = 0; x < TILE; x++) {
    const t = x / (TILE - 1);
    const y = Math.floor(8 - Math.sin(t * Math.PI) * 4);
    px(ctx, x, y, "#b4bcc8");
    if (y > 0) px(ctx, x, y - 1, "#909aa8");
  }
  px(ctx, 1, 1, "#666c78");
  px(ctx, TILE - 2, 1, "#666c78");
  return c;
}

/* ---------------------------------------------------------------- */
/* Slot 246 — TUNNEL_LED_RING                                       */
/* ---------------------------------------------------------------- */
function drawLedRing() {
  const c = makeCanvas();
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1a1d22";
  ctx.fillRect(0, 0, TILE, TILE);
  const cx = TILE / 2 - 0.5;
  const cy = TILE / 2 - 0.5;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= 6.5 && d >= 5.0) px(ctx, x, y, "#4a5260");
      else if (d <= 5.0 && d >= 3.5) px(ctx, x, y, "#f4d870");
      else if (d <= 3.5 && d >= 2.0) px(ctx, x, y, "#ffefa0");
      else if (d <= 2.0) px(ctx, x, y, "#ffffff");
    }
  }
  return c;
}

/* ---------------------------------------------------------------- */
/* Slot 247 — TUNNEL_SPONSOR_PANEL                                  */
/* ---------------------------------------------------------------- */
function drawSponsorPanel() {
  const c = makeCanvas();
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1c1e22";
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.fillStyle = "#3a3e46";
  ctx.fillRect(0, 0, TILE, 1);
  ctx.fillRect(0, TILE - 1, TILE, 1);
  ctx.fillRect(0, 0, 1, TILE);
  ctx.fillRect(TILE - 1, 0, 1, TILE);
  const dotColor = "#ffd84a";
  const pattern = [
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
    [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
  ];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 11; col++) {
      if (pattern[row][col] === 1) {
        px(ctx, 2 + col, 6 + row, dotColor);
      }
    }
  }
  return c;
}

/* ---------------------------------------------------------------- */
/* Slot 248 — TUNNEL_ACCENT_TRIM                                    */
/* ---------------------------------------------------------------- */
function drawAccentTrim() {
  const c = makeCanvas();
  const ctx = c.getContext("2d");
  fillRect(ctx, 0, 0, TILE, 7, "#a8141e");
  fillRect(ctx, 0, 7, TILE, 2, "#0c0c0e");
  fillRect(ctx, 0, 9, TILE, TILE - 9, "#0e7c7c");
  fillRect(ctx, 0, 0, TILE, 1, "#c83040");
  fillRect(ctx, 0, TILE - 1, TILE, 1, "#085050");
  return c;
}

/* ---------------------------------------------------------------- */
/* Slot 249 — TUNNEL_FLUTED_PANEL                                   */
/* ---------------------------------------------------------------- */
function drawFlutedPanel() {
  const c = makeCanvas();
  const ctx = c.getContext("2d");
  for (let x = 0; x < TILE; x++) {
    let color;
    const k = x % 3;
    if (k === 0) color = "#3e424c";
    else if (k === 1) color = "#52576a";
    else color = "#2a2e36";
    fillRect(ctx, x, 0, 1, TILE, color);
  }
  fillRect(ctx, 0, 0, TILE, 1, "#1a1c22");
  fillRect(ctx, 0, TILE - 1, TILE, 1, "#1a1c22");
  return c;
}

/**
 * Returns a {slot: HTMLCanvasElement} map. Start.js stitches each into the
 * stadium atlas at the corresponding slot.
 */
export function buildProceduralTextureCanvases() {
  return {
    242: drawGlassPanel(),
    243: drawMarbleFloor(),
    244: drawRedCarpet(),
    245: drawArchSegment(),
    246: drawLedRing(),
    247: drawSponsorPanel(),
    248: drawAccentTrim(),
    249: drawFlutedPanel(),
  };
}
