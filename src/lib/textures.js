import * as THREE from "three";

/** Canvas-drawn textures: lamps, cabin screens and the hero backdrop. */

function canvasTexture(width, height, draw, { srgb = true } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/* ------------------------------------------------------------- lamps */

// Headlight drawn for the right-hand corner: u=0 wraps onto the fender,
// u=1 is the inner end beside the nose.
function headlightPath(ctx, w, h) {
  ctx.beginPath();
  ctx.moveTo(0.94 * w, 0.6 * h);
  ctx.quadraticCurveTo(0.97 * w, 0.42 * h, 0.9 * w, 0.36 * h);
  ctx.bezierCurveTo(0.6 * w, 0.3 * h, 0.3 * w, 0.2 * h, 0.06 * w, 0.14 * h);
  ctx.quadraticCurveTo(0.0 * w, 0.16 * h, 0.05 * w, 0.27 * h);
  ctx.bezierCurveTo(0.3 * w, 0.5 * h, 0.6 * w, 0.66 * h, 0.86 * w, 0.7 * h);
  ctx.quadraticCurveTo(0.93 * w, 0.7 * h, 0.94 * w, 0.6 * h);
  ctx.closePath();
}

export function createHeadlightTextures() {
  const W = 1024;
  const H = 300;
  const map = canvasTexture(W, H, (ctx, w, h) => {
    headlightPath(ctx, w, h);
    const g = ctx.createLinearGradient(0, 0.15 * h, 0, 0.7 * h);
    g.addColorStop(0, "#2b2f35");
    g.addColorStop(1, "#08090b");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    // reflector bowls
    [0.62, 0.78].forEach((u) => {
      const rg = ctx.createRadialGradient(u * w, 0.5 * h, 4, u * w, 0.5 * h, 0.12 * h);
      rg.addColorStop(0, "#f4f6f8");
      rg.addColorStop(0.45, "#7c8590");
      rg.addColorStop(1, "#16181b");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(u * w, 0.5 * h, 0.11 * h, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    headlightPath(ctx, w, h);
    ctx.stroke();
  });
  const emissive = canvasTexture(W, H, (ctx, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    headlightPath(ctx, w, h);
    ctx.clip();
    // daytime running strip along the upper edge
    ctx.strokeStyle = "#fff";
    ctx.lineCap = "round";
    ctx.lineWidth = 0.055 * h;
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(0.9 * w, 0.43 * h);
    ctx.bezierCurveTo(0.6 * w, 0.37 * h, 0.3 * w, 0.27 * h, 0.08 * w, 0.21 * h);
    ctx.stroke();
    [0.62, 0.78].forEach((u) => {
      const rg = ctx.createRadialGradient(u * w, 0.5 * h, 2, u * w, 0.5 * h, 0.1 * h);
      rg.addColorStop(0, "#fff");
      rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(u * w, 0.5 * h, 0.1 * h, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  });
  return { map, emissive };
}

function tailPath(ctx, w, h) {
  const r = 0.5 * h;
  ctx.beginPath();
  // corner clusters joined by a slim bar
  ctx.moveTo(0.02 * w, 0.2 * h);
  ctx.lineTo(0.16 * w, 0.12 * h);
  ctx.quadraticCurveTo(0.2 * w, 0.4 * h, 0.24 * w, 0.4 * h);
  ctx.lineTo(0.76 * w, 0.4 * h);
  ctx.quadraticCurveTo(0.8 * w, 0.4 * h, 0.84 * w, 0.12 * h);
  ctx.lineTo(0.98 * w, 0.2 * h);
  ctx.quadraticCurveTo(w, 0.5 * h, 0.98 * w, 0.8 * h);
  ctx.lineTo(0.84 * w, 0.88 * h);
  ctx.quadraticCurveTo(0.8 * w, 0.6 * h, 0.76 * w, 0.6 * h);
  ctx.lineTo(0.24 * w, 0.6 * h);
  ctx.quadraticCurveTo(0.2 * w, 0.6 * h, 0.16 * w, 0.88 * h);
  ctx.lineTo(0.02 * w, 0.8 * h);
  ctx.quadraticCurveTo(0, 0.5 * h, 0.02 * w, 0.2 * h);
  ctx.closePath();
  return r;
}

export function createTaillightTextures() {
  const W = 2048;
  const H = 160;
  const map = canvasTexture(W, H, (ctx, w, h) => {
    tailPath(ctx, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#5a0a10");
    g.addColorStop(1, "#1d0205");
    ctx.fillStyle = g;
    ctx.fill();
  });
  const emissive = canvasTexture(W, H, (ctx, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    tailPath(ctx, w, h);
    ctx.clip();
    ctx.strokeStyle = "#fff";
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 0.09 * h;
    ctx.beginPath();
    ctx.moveTo(0.05 * w, 0.5 * h);
    ctx.lineTo(0.95 * w, 0.5 * h);
    ctx.stroke();
    // C-shaped clusters at the corners
    ctx.lineWidth = 0.07 * h;
    [
      [0.14, 0.04],
      [0.86, 0.96],
    ].forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(a * w, 0.24 * h);
      ctx.lineTo(b * w, 0.3 * h);
      ctx.moveTo(a * w, 0.76 * h);
      ctx.lineTo(b * w, 0.7 * h);
      ctx.stroke();
    });
    ctx.restore();
  });
  return { map, emissive };
}

/** Soft rounded rectangle alpha mask for intakes, handles and diffusers. */
export function createPillTexture(radius = 0.5) {
  return canvasTexture(512, 128, (ctx, w, h) => {
    const r = radius * h;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.roundRect(4, 4, w - 8, h - 8, r);
    ctx.fill();
  });
}

/* --------------------------------------------------------- cabin UI */

export function createScreenTexture() {
  return canvasTexture(1280, 720, (ctx, w, h) => {
    // map pane
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#1a1d22");
    bg.addColorStop(1, "#0d0f12");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0.36 * w, 0, 0.64 * w, h);
    ctx.clip();
    ctx.fillStyle = "#14171c";
    ctx.fillRect(0.36 * w, 0, 0.64 * w, h);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    ctx.strokeStyle = "#262b33";
    for (let i = 0; i < 46; i++) {
      ctx.lineWidth = rand() > 0.8 ? 10 : 4;
      ctx.beginPath();
      const x = 0.36 * w + rand() * 0.64 * w;
      const y = rand() * h;
      ctx.moveTo(x - 400, y + (rand() - 0.5) * 300);
      ctx.bezierCurveTo(x - 100, y, x + 100, y + (rand() - 0.5) * 200, x + 420, y + (rand() - 0.5) * 300);
      ctx.stroke();
    }
    ctx.strokeStyle = "#3e8bff";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0.68 * w, 0.92 * h);
    ctx.bezierCurveTo(0.7 * w, 0.6 * h, 0.82 * w, 0.55 * h, 0.86 * w, 0.18 * h);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0.68 * w, 0.9 * h, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // vehicle pane
    ctx.fillStyle = "#e9ebee";
    ctx.font = "500 30px system-ui, sans-serif";
    ctx.fillText("P  R  N  D", 0.05 * w, 0.1 * h);
    ctx.font = "300 150px system-ui, sans-serif";
    ctx.fillText("0", 0.12 * w, 0.4 * h);
    ctx.font = "400 26px system-ui, sans-serif";
    ctx.fillStyle = "#8b9099";
    ctx.fillText("MPH", 0.13 * w, 0.46 * h);
    ctx.fillText("● 87%  ·  348 mi", 0.05 * w, 0.93 * h);
    // top view silhouette
    ctx.strokeStyle = "#d8dbe0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(0.1 * w, 0.52 * h, 0.16 * w, 0.32 * h, 60);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(0.125 * w, 0.6 * h, 0.11 * w, 0.14 * h, 24);
    ctx.stroke();

    // dock
    ctx.fillStyle = "#0a0b0d";
    ctx.fillRect(0, 0.88 * h, w, 0.12 * h);
    ctx.fillStyle = "#e9ebee";
    ctx.font = "400 30px system-ui, sans-serif";
    ctx.fillText("21°", 0.46 * w, 0.955 * h);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i === 2 ? "#3e8bff" : "#2a2e35";
      ctx.beginPath();
      ctx.roundRect(0.55 * w + i * 70, 0.905 * h, 46, 46, 12);
      ctx.fill();
    }
  });
}

export function createClusterTexture() {
  return canvasTexture(640, 220, (ctx, w, h) => {
    ctx.fillStyle = "#0b0c0e";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f1f2f4";
    ctx.font = "300 96px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("0", w / 2, 0.62 * h);
    ctx.font = "400 22px system-ui, sans-serif";
    ctx.fillStyle = "#8b9099";
    ctx.fillText("MPH  ·  PLAID", w / 2, 0.85 * h);
    ctx.fillStyle = "#3e8bff";
    ctx.fillRect(0.08 * w, 0.2 * h, 0.12 * w, 6);
    ctx.fillStyle = "#e31937";
    ctx.fillRect(0.8 * w, 0.2 * h, 0.12 * w, 6);
  });
}

/* ------------------------------------------------------- backdrop text */

export function createBackdropTexture(text, fontFamily) {
  return canvasTexture(
    4096,
    1024,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.font = `600 760px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#fff";
      if ("letterSpacing" in ctx) ctx.letterSpacing = "-30px";
      ctx.strokeText(text, w / 2, h / 2 + 30);
    },
    { srgb: false }
  );
}
