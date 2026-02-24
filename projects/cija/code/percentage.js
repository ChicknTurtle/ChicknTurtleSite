const Tint = (() => {
  const c = (typeof OffscreenCanvas !== "undefined") ? new OffscreenCanvas(1, 1) : document.createElement("canvas");
  const x = c.getContext("2d");
  const cache = new Map();
  return function drawTinted(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh, color) {
    const key = `${img._tintId || (img._tintId = Math.random())}|${sx},${sy},${sw},${sh}|${color}`;
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

function TintBorder8(ctx, img, sx, sy, sw, sh, x, y, dw, dh, r, color) {
  for (let oy = -r; oy <= r; oy += r) {
    for (let ox = -r; ox <= r; ox += r) {
      if (ox === 0 && oy === 0) continue;
      Tint(ctx, img, sx, sy, sw, sh, x + ox, y + oy, dw, dh, color);
    }
  }
}

const HueShift = (() => {
  const c = (typeof OffscreenCanvas !== "undefined")
    ? new OffscreenCanvas(1, 1)
    : document.createElement("canvas");
  const x = c.getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const HUE_STEPS = 360;
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h, s, l];
  }
  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r * 255, g * 255, b * 255];
  }
  return function drawHueShifted(
    ctx, img,
    sx, sy, sw, sh,
    dx, dy, dw, dh,
    hueDeg
  ) {
    const hueStep = ((hueDeg % 360 + 360) % 360);
    const quantHue = Math.round(hueStep / 360 * HUE_STEPS);
    const key = `${img.src || ""}|${sx},${sy},${sw},${sh}|${quantHue}`;
    let shifted = cache.get(key);
    if (!shifted) {
      c.width = sw;
      c.height = sh;
      x.clearRect(0, 0, sw, sh);
      x.imageSmoothingEnabled = false;
      x.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const imgData = x.getImageData(0, 0, sw, sh);
      const d = imgData.data;
      const hAdd = quantHue / HUE_STEPS;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        let [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
        h = (h + hAdd) % 1;
        const [r, g, b] = hslToRgb(h, s, l);
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
      }
      x.putImageData(imgData, 0, 0);
      shifted = (typeof OffscreenCanvas !== "undefined")
        ? c.transferToImageBitmap()
        : (() => {
          const out = document.createElement("canvas");
          out.width = sw;
          out.height = sh;
          out.getContext("2d").drawImage(c, 0, 0);
          return out;
        })();
      cache.set(key, shifted);
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(shifted, dx, dy, dw, dh);
  };
})();

function drawPercentage(ctx, pos = new Vec2(), font = 0, scale = 1, anchor = new Vec2(0, 0), pivot = new Vec2(0, 0)) {
  const digitCharIndex = { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '%': 10 };
  const digitWidths = [
    { '0': 12, '1': 7, '2': 12, '3': 11, '4': 12, '5': 12, '6': 12, '7': 11, '8': 12, '9': 12, '%': 12 },
    { '0': 12, '1': 4, '2': 12, '3': 11, '4': 12, '5': 12, '6': 12, '7': 11, '8': 12, '9': 12, '%': 12 },
    { '0': 10, '1': 6, '2': 10, '3': 10, '4': 10, '5': 10, '6': 10, '7': 10, '8': 10, '9': 10, '%': 12 },
    { '0': 12, '1': 6, '2': 12, '3': 12, '4': 12, '5': 11, '6': 12, '7': 11, '8': 12, '9': 12, '%': 13 },
  ];
  const img = Game.spritesheets['digits'];
  const widths = digitWidths[font] || digitWidths[0];
  const n = Math.max(0, Math.floor(+Game.percentage || 0));
  const text = String(n) + '%';
  const tile = 16;
  ctx.imageSmoothingEnabled = false;
  const gap = 1;
  const scaleGap = gap * scale;
  const chars = [];
  let totalWidth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const sw = (widths[ch] ?? tile);
    const sh = tile;
    const sx = (digitCharIndex[ch] ?? 0) * tile;
    const sy = font * tile;
    const dw = sw * scale;
    const dh = sh * scale;
    chars.push({ ch, sx, sy, sw, sh, dw, dh });
    totalWidth += dw;
    if (i < text.length - 1) totalWidth += scaleGap;
  }
  const v = (typeof UI !== 'undefined' && UI.viewport) ? UI.viewport() : new Vec2(Game.canvas.width / Game.dpr, Game.canvas.height / Game.dpr);
  if (Game.percentage >= 100) {
    const sw = 48, sh = 32, dw = sw * scale, dh = sh * scale;
    const x = v.x * anchor.x + pos.x - dw * pivot.x;
    let y = v.y * anchor.y + pos.y - dh * pivot.y;
    y += Math.sin(Game.gameTime * 6) * 2;
    HueShift(ctx, Game.spritesheets['100'], 0, 0, 48, 32, x, y, dw, dh, Game.gameTime * 100);
    return;
  }
  let x = v.x * anchor.x + pos.x - totalWidth * pivot.x;
  const y = v.y * anchor.y + pos.y - tile * scale * pivot.y;
  const p = Math.max(0, Math.min(99, +Game.percentage || 0));
  const t = p / 99, u = t * 2;
  const r = 0 | (t < 0.5 ? 255 : 255 * (1 - (u - 1)));
  const g = 0 | (t < 0.5 ? 255 * u : 255);
  const b = 0;
  const borderColor = `rgb(${r} ${g} ${b})`;
  const borderSize = 2*scale;
  const blackBorderSize = 1*scale;
  const color = 'rgb(255,255,255)';
  function TintBorderSquareRing(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh, outerRadius, innerRadius, color) {
    const or = Math.max(1, Math.floor(outerRadius));
    const ir = Math.max(0, Math.floor(innerRadius));
    for (let oy = -or; oy <= or; oy++) {
      for (let ox = -or; ox <= or; ox++) {
        const mx = Math.max(Math.abs(ox), Math.abs(oy));
        if (mx === 0) continue;
        if (mx <= ir) continue;
        Tint(ctx, img, sx, sy, sw, sh, Math.round(dx + ox), Math.round(dy + oy), dw, dh, color);
      }
    }
  }
  for (let i = 0; i < chars.length; i++) {
    const { ch, sx, sy, sw, sh, dw, dh } = chars[i];
    TintBorderSquareRing(ctx, img, sx, sy, sw, sh, Math.round(x), Math.round(y), Math.round(dw), Math.round(dh), borderSize, blackBorderSize, borderColor);
    TintBorderSquareRing(ctx, img, sx, sy, sw, sh, Math.round(x), Math.round(y), Math.round(dw), Math.round(dh), blackBorderSize, 0, 'black');
    Tint(ctx, img, sx, sy, sw, sh, Math.round(x), Math.round(y), Math.round(dw), Math.round(dh), color);
    x += dw;
    if (i < chars.length - 1) x += scaleGap;
  }
}
