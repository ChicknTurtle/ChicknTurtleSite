
import { Vec2 } from "../utils/lib.js"
import { Game } from "../game.js"

export const UI = {
  managers: {},
}

UI.viewport = () => new Vec2(Game.canvas.width / Game.dpr, Game.canvas.height / Game.dpr)
UI._a = v => (v === 'left' || v === 'top') ? 0 : (v === 'center' || v === 'middle') ? 0.5 : 1
UI.anchor = (x = 'left', y = 'top') => new Vec2(UI._a(x), UI._a(y))

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
      if (el && el.visible && el.tick) {
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
