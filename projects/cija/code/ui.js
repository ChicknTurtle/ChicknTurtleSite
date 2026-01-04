const UI = {
  managers: {},
}

UI.viewport = () => new Vec2(Game.canvas.width / Game.dpr, Game.canvas.height / Game.dpr)
UI._a = v => (v === 'left' || v === 'top') ? 0 : (v === 'center' || v === 'middle') ? 0.5 : 1
UI.anchor = (x = 'left', y = 'top') => new Vec2(UI._a(x), UI._a(y))

UI.drawNineSlice = function (ctx, img, spritesize, slices, pos, size, offset, scale) {
  const x = pos.x, y = pos.y;
  let width = size.x, height = size.y;
  const top = slices[0], right = slices[1], bottom = slices[2], left = slices[3];
  width  -= (left * scale - left) + (right * scale - right);
  height -= (top  * scale - top ) + (bottom * scale - bottom);
  if (width < left + right || height < top + bottom) return;
  const middleWidth  = spritesize.x - left - right;
  const middleHeight = spritesize.y - top - bottom;
  const destMiddleWidth  = width  - left - right;
  const destMiddleHeight = height - top - bottom;
  const textureX = offset.x;
  const textureY = offset.y;
  const lS = left * scale, rS = right * scale, tS = top * scale, bS = bottom * scale;
  const dx0 = x;
  const dx1 = x + lS;
  const dx2 = dx1 + destMiddleWidth;
  const dy0 = y;
  const dy1 = y + tS;
  const dy2 = dy1 + destMiddleHeight;
  const sx0 = textureX;
  const sx1 = textureX + left;
  const sx2 = sx1 + middleWidth;
  const sy0 = textureY;
  const sy1 = textureY + top;
  const sy2 = sy1 + middleHeight;
  ctx.drawImage(img, sx0, sy0, left, top, dx0, dy0, lS, tS);
  ctx.drawImage(img, sx1, sy0, middleWidth, top, dx1, dy0, destMiddleWidth, tS);
  ctx.drawImage(img, sx2, sy0, right, top, dx2, dy0, rS, tS);
  ctx.drawImage(img, sx0, sy1, left, middleHeight, dx0, dy1, lS, destMiddleHeight);
  ctx.drawImage(img, sx1, sy1, middleWidth, middleHeight, dx1, dy1, destMiddleWidth, destMiddleHeight);
  ctx.drawImage(img, sx2, sy1, right, middleHeight, dx2, dy1, rS, destMiddleHeight);
  ctx.drawImage(img, sx0, sy2, left, bottom, dx0, dy2, lS, bS);
  ctx.drawImage(img, sx1, sy2, middleWidth, bottom, dx1, dy2, destMiddleWidth, bS);
  ctx.drawImage(img, sx2, sy2, right, bottom, dx2, dy2, rS, bS);
};

UI.Manager = class {
  constructor() {
    this.elements = {};
  }
  show(key, builder) {
    if (!this.elements[key]) {
      this.elements[key] = builder();
    }
    this.elements[key].visible = true;
  }
  hide(key) {
    if (this.elements[key]) {
      this.elements[key].visible = false;
    }
  }
  destroy(key) {
    delete this.elements[key];
  }
  destroyAll() {
    this.elements = {};
  }
  tick() {
    for (const key in this.elements) {
      const el = this.elements[key];
      if (el.visible && el.tick) {
        el.tick();
      }
    }
  }
  draw(ctx) {
    for (const key in this.elements) {
      const el = this.elements[key];
      if (el.visible && el.draw) {
        el.draw(ctx);
      }
    }
  }
}

UI.Element = class {
  constructor() {
    this.visible = true;
    this.anchor = UI.anchor('left', 'top');
    this.pivot = UI.anchor('left', 'top');
  }
  tick() {
  }
  draw(ctx) {
  }
  getScreenPos() {
    const v = UI.viewport();
    return new Vec2(
      v.x * this.anchor.x + this.pos.x - this.size.x * this.pivot.x,
      v.y * this.anchor.y + this.pos.y - this.size.y * this.pivot.y
    );
  }
}

UI.TextLabel = class extends UI.Element {
  constructor(pos = new Vec2(), text = '', font = '20px Pixellari', color = 'white') {
    super();
    this.pos = pos;
    this.size = new Vec2(0,0);
    this.text = text;
    this.font = font;
    this.color = color;
    this.effects = {};
    this.textAlign = 'center';
    this.textBaseline = 'middle';
  }
  tick() {
  }
  draw(ctx) {
    const p = this.getScreenPos();
    ctx.fillStyle = this.color;
    ctx.font = this.font;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;
    const c = new Text.Component(this.text);
    c.effects = this.effects;
    Text.draw(ctx, c, p);
  }
}

UI.Button = class extends UI.Element {
  constructor(pos = new Vec2(), size = new Vec2(200, 50), onClick = null) {
    super();
    this.pos = pos;
    this.size = size;
    this.onClick = onClick;
    this.hover = false;
    this.disabled = false;
    this.screenPos = new Vec2();
    this.anchor = UI.anchor('center', 'center');
    this.pivot = UI.anchor('center', 'center');
  }
  updateHover() {
    const p = this.getScreenPos();
    if (Game.mousePos) {
      const m = Game.mousePos;
      this.hover = (
        m.x >= p.x &&
        m.x <= p.x + this.size.x &&
        m.y >= p.y &&
        m.y <= p.y + this.size.y
      )
    }
    if (this.hover && !this.disabled) {
      setCursor('pointer');
    }
  }
  checkClicked() {
    const clicked = (Game.inputsClicked && Game.inputsClicked['Mouse0']);
    if (this.hover && clicked && !this.disabled && this.onClick) {
      this.onClick();
    }
  }
  tick() {
    const pos = this.getScreenPos();
    this.screenPos = pos;
    this.updateHover();
    this.checkClicked();
  }
  draw(ctx) {
    const pos = this.screenPos || this.getScreenPos();
    ctx.fillStyle = this.hover ? 'white' : 'black';
    ctx.fillRect(pos.x, pos.y, this.size.x, this.size.y);
  }
}

UI.MenuButton = class extends UI.Button {
  constructor(pos = new Vec2(), size = new Vec2(200, 50), onClick = null, text = '') {
    super(pos, size, onClick);
    this.text = text;
  }
  tick() {
    super.tick();
  }
  draw(ctx) {
    const pos = this.screenPos || this.getScreenPos();
    ctx.imageSmoothingEnabled = false;
    if (this.disabled) {
      UI.drawNineSlice(ctx, Game.spritesheets['ui'], new Vec2(32, 16), [7, 6, 5, 6], pos, this.size, new Vec2(64, 0), 2);
    } else if (this.hover) {
      UI.drawNineSlice(ctx, Game.spritesheets['ui'], new Vec2(32, 16), [5, 6, 7, 6], pos, this.size, new Vec2(32, 0), 2);
    } else {
      UI.drawNineSlice(ctx, Game.spritesheets['ui'], new Vec2(32, 16), [5, 6, 7, 6], pos, this.size, new Vec2(0, 0), 2);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = this.disabled ? 'rgb(127,127,127)' : 'rgb(255,255,255)';
    ctx.font = `30px DigitalDisco`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const c = new Text.Component(this.text);
    c.effects.shadow.pos.y = 2;
    Text.draw(ctx, c, pos.plus(new Vec2(this.size.x / 2, this.size.y / 2 + (this.disabled ? 4 : 0))));
  }
}

UI.SettingsButton = class extends UI.Button {
  constructor(pos = new Vec2(), size = new Vec2(50, 50), onClick = null) {
    super(pos, size, onClick);
  }
  tick() {
    super.tick();
  }
  draw(ctx) {
    const pos = this.screenPos || this.getScreenPos();
    const sx = this.hover ? 16 : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(Game.spritesheets['ui'], sx, 32, 16, 16, pos.x, pos.y, this.size.x, this.size.y);

  }
}
