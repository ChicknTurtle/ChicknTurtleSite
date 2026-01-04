
const UI = {
  managers: {},
}

UI.drawNineSlice = function(ctx, img, spritesize, slices, pos, size, offset, scale) {
  const [x, y] = pos.toArray();
  let [width, height] = size.toArray();
  const [top, right, bottom, left] = slices;
  width -= left*scale-left + right*scale-right;
  height -= top*scale-top + bottom*scale-bottom;
  const middleWidth = spritesize.x - left - right;
  const middleHeight = spritesize.y - top - bottom;
  const destMiddleWidth = width - left - right;
  const destMiddleHeight = height - top - bottom;
  if (width < left + right || height < top + bottom) {
    return;
  }
  const textureX = offset.x;
  const textureY = offset.y;
  const parts = [
    // top-left
    [textureX, textureY, left, top, x, y, left*scale, top*scale],
    // top
    [textureX + left, textureY, middleWidth, top, x + left*scale, y, destMiddleWidth, top*scale],
    // top-right
    [textureX + left + middleWidth, textureY, right, top, x + left*scale + destMiddleWidth, y, right*scale, top*scale],
    // left
    [textureX, textureY + top, left, middleHeight, x, y + top*scale, left*scale, destMiddleHeight],
    // center
    [textureX + left, textureY + top, middleWidth, middleHeight, x + left*scale, y + top*scale, destMiddleWidth, destMiddleHeight],
    // right
    [textureX + left + middleWidth, textureY + top, right, middleHeight, x + left*scale + destMiddleWidth, y + top*scale, right*scale, destMiddleHeight],
    // bottom-left
    [textureX, textureY + top + middleHeight, left, bottom, x, y + top*scale + destMiddleHeight, left*scale, bottom*scale],
    // bottom
    [textureX + left, textureY + top + middleHeight, middleWidth, bottom, x + left*scale, y + top*scale + destMiddleHeight, destMiddleWidth, bottom*scale],
    // bottom-right
    [textureX + left + middleWidth, textureY + top + middleHeight, right, bottom, x + left*scale + destMiddleWidth, y + top*scale + destMiddleHeight, right*scale, bottom*scale]
  ];
  parts.forEach(params => {
    ctx.drawImage(img, ...params);
  });
}

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
  }
  tick() {
  }
  draw(ctx) {
  }
}

UI.Button = class extends UI.Element {
  constructor(pos=new Vec2(), size=new Vec2(200,50), onClick=null) {
    super();
    this.pos = pos;
    this.size = size;
    this.onClick = onClick;
    this.hover = false;
  }
  tick() {
    if (Game.mousePos) {
      const pos = Game.mousePos;
      this.hover = (
        pos.x >= this.pos.x &&
        pos.x <= this.pos.x + this.size.x &&
        pos.y >= this.pos.y &&
        pos.y <= this.pos.y + this.size.y
      )
      if (this.hover && Game.inputs['Mouse0'] && this.onClick) {
        this.onClick();
      }
    }
  }
  draw(ctx) {
    ctx.fillStyle = this.hover ? 'white' : 'black';
    ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
  }
}

UI.MenuButton = class extends UI.Button {
  constructor(pos=new Vec2(), size=new Vec2(200,50), onClick=null, text='') {
    super(pos, size, onClick);
    this.text = text;
  }
  tick() {
    this.pos.x = Game.canvas.width*(1/Game.dpr)/2 - this.size.x/2;
    if (Game.mousePos) {
      const pos = Game.mousePos;
      this.hover = (
        pos.x >= this.pos.x &&
        pos.x <= this.pos.x + this.size.x &&
        pos.y >= this.pos.y &&
        pos.y <= this.pos.y + this.size.y
      )
      if (this.hover && Game.inputsClicked['Mouse0'] && this.onClick) {
        this.onClick();
      }
    }
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const offset = this.hover ? new Vec2(24,0) : new Vec2(0,0);
    UI.drawNineSlice(ctx, Game.spritesheets['ui'], new Vec2(24,24), [2,2,3,2], this.pos, this.size, offset, 4);
    // text
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = 'white';
    ctx.font = `${this.size.y*0.6}px Pixellari`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const c = new Text.Component(this.text);
    c.effects.shake = this.hover ? 3 : 0;
    c.effects.shadow.pos.y = 2;
    Text.draw(ctx, c, this.pos.plus(new Vec2(this.size.x/2,this.size.y/2)));
  }
}
