
const UI = {
  managers: {},
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
