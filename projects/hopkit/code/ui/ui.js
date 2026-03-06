
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
  get(key) {
    return this.elements[key];
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
  destroy(target) {
    if (!target) return;
    if (typeof target === "string") {
      delete this.elements[target];
      return;
    }
    for (const key in this.elements) {
      if (this.elements[key] === target) {
        delete this.elements[key];
        return;
      }
    }
  }
  destroyAll() {
    this.elements = {};
  }
  tick() {
    for (const key in this.elements) {
      const el = this.elements[key];
      if (el && el.tick) {
        el.tick();
      }
    }
    const allVisible = Object.values(this.elements).filter(el => el && el.visible);
    const interactive = allVisible.filter(el => typeof el.updateHover === 'function');
    if (!Game.mousePos) {
      interactive.forEach(el => el.updateHover(false));
      return;
    }
    const m = Game.mousePos;
    const blockers = allVisible.filter(el => {
      const p = el.screenPos || (typeof el.getScreenPos === 'function' ? el.getScreenPos() : null);
      if (!p || !el.size) return false;
      return m.x >= p.x && m.x <= p.x + el.size.x && m.y >= p.y && m.y <= p.y + el.size.y;
    });
    if (blockers.length === 0) {
      const candidates = interactive.filter(el => {
        const p = el.screenPos || (typeof el.getScreenPos === 'function' ? el.getScreenPos() : null);
        if (!p || !el.size) return false;
        return !el.disabled &&
          m.x >= p.x &&
          m.x <= p.x + el.size.x &&
          m.y >= p.y &&
          m.y <= p.y + el.size.y;
      });
      if (candidates.length === 0) {
        interactive.forEach(el => el.updateHover(false));
      } else {
        candidates.sort((a, b) => (b.z ?? 0) - (a.z ?? 0));
        const top = candidates[0];
        interactive.forEach(el => el.updateHover(el === top));
        if (Game.inputsClicked?.['Mouse0']) {
          if (typeof top.checkClicked === 'function') top.checkClicked();
        }
      }
    } else {
      blockers.sort((a, b) => (b.z ?? 0) - (a.z ?? 0));
      const topBlocker = blockers[0];
      if (typeof topBlocker.updateHover === 'function') {
        interactive.forEach(el => el.updateHover(el === topBlocker));
        if (Game.inputsClicked?.['Mouse0']) {
          if (typeof topBlocker.checkClicked === 'function') topBlocker.checkClicked();
        }
      } else {
        interactive.forEach(el => el.updateHover(false));
      }
    }
  }
  draw(ctx) {
    Object.values(this.elements)
      .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
      .forEach(el => {
        if (el.visible && el.draw) {
          el.draw(ctx);
        }
      });
  }
}
