const Tint = (() => {
  const c = (typeof OffscreenCanvas !== "undefined") ? new OffscreenCanvas(1, 1) : document.createElement("canvas");
  const x = c.getContext("2d");
  const cache = new Map();
  return function drawTinted(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh, color) {
    const key = `${img.src || ""}|${sx},${sy},${sw},${sh}|${color}`;
    let tinted = cache.get(key);
    if (!tinted) {
      c.width = sw; c.height = sh;
      x.clearRect(0, 0, sw, sh);
      x.imageSmoothingEnabled = false;
      x.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      x.globalCompositeOperation = "source-in";
      x.fillStyle = color;
      x.fillRect(0, 0, sw, sh);
      x.globalCompositeOperation = "source-over";
      tinted = (typeof OffscreenCanvas !== "undefined") ? c.transferToImageBitmap() : (() => {
        const out = document.createElement("canvas");
        out.width = sw; out.height = sh;
        out.getContext("2d").drawImage(c, 0, 0);
        return out;
      })();
      cache.set(key, tinted);
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tinted, dx, dy, dw, dh);
  };
})();

function drawPercentage(ctx, pos = new Vec2(), font = 0, scale = 1, anchor = new Vec2(0, 0), pivot = new Vec2(0, 0)) {
  const digitCharIndex = { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '%': 10 };
  const digitWidths = [
    { '0': 12, '1': 7, '2': 12, '3': 11, '4': 12, '5': 12, '6': 12, '7': 11, '8': 12, '9': 12, '%': 12 },
    { '0': 12, '1': 4, '2': 12, '3': 11, '4': 12, '5': 12, '6': 12, '7': 11, '8': 12, '9': 12, '%': 12 },
    { '0': 10, '1': 6, '2': 10, '3': 10, '4': 10, '5': 10, '6': 10, '7': 10, '8': 10, '9': 10, '%': 12 },
  ];
  const img = Game.spritesheets['digits'];
  const widths = digitWidths[font] || digitWidths[0];
  const n = Math.max(0, Math.floor(+Game.percentage || 0));
  const text = String(n) + '%';
  const tile = 16;
  ctx.imageSmoothingEnabled = false;
  let total = 0;
  for (let i = 0; i < text.length; i++) total += (widths[text[i]] ?? tile) * scale;
  const v = (typeof UI !== 'undefined' && UI.viewport) ? UI.viewport() : new Vec2(Game.canvas.width / Game.dpr, Game.canvas.height / Game.dpr);
  if (Game.percentage >= 100) {
    const sw = 48, sh = 32, dw = sw * scale, dh = sh * scale;
    const x = v.x * anchor.x + pos.x - dw * pivot.x;
    let y = v.y * anchor.y + pos.y - dh * pivot.y;
    y += Math.sin(Game.gameTime * 6) * 2;
    const strips = 24;
    for (let i = 0; i < strips; i++) {
      const t = i / (strips - 1);
      const sx = (sw * i / strips) | 0;
      const sw2 = ((sw * (i + 1) / strips) | 0) - sx;
      ctx.filter = `hue-rotate(${(Game.gameTime * 200 + t * -180)}deg)`;
      ctx.drawImage(Game.spritesheets['100'], sx, 0, sw2, sh, x + (dw * i / strips), y, dw * (sw2 / sw), dh);
    }
    ctx.filter = 'none';
    return;
  }
  let x = v.x * anchor.x + pos.x - total * pivot.x;
  const y = v.y * anchor.y + pos.y - tile * scale * pivot.y;
  const p = Math.max(0, Math.min(99, +Game.percentage || 0));
  const t = p / 99, u = t * 2;
  const r = 0 | (t < 0.5 ? 255 : 255 * (1 - (u - 1)));
  const g = 0 | (t < 0.5 ? 255 * u : 255);
  const b = 0;
  const color = `rgb(${r} ${g} ${b})`;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], idx = digitCharIndex[ch];
    if (idx == null) continue;
    const sw = tile, sh = tile, dw = tile * scale, dh = tile * scale;
    const sx = idx * tile, sy = font * tile;
    if (typeof Tint === 'function') Tint(ctx, img, sx, sy, sw, sh, x, y, dw, dh, color);
    else {
      ctx.save();
      ctx.drawImage(img, sx, sy, sw, sh, x, y, dw, dh);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = color;
      ctx.fillRect(x, y, dw, dh);
      ctx.restore();
    }
    x += (widths[ch] ?? tile) * scale;
  }
}
