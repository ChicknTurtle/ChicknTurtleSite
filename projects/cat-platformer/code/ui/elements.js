
import { Vec2 } from "./../lib.js"
import { Game } from "./../game.js"
import { Text } from "./../text.js"
import { UI } from "./ui.js"

export const Elements = {}

Elements.Element = class {
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

Elements.TextLabel = class extends Elements.Element {
  constructor(pos = new Vec2(), text = '', font = '20px Pixellari', color = 'white') {
    super();
    this.pos = pos;
    this.size = new Vec2(0, 0);
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

Elements.Button = class extends Elements.Element {
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
  }
  checkClicked() {
    const clicked = (Game.inputsClicked && Game.inputsClicked['Mouse0']);
    if (this.hover && clicked && !this.disabled && this.onClick) {
      delete Game.inputs['Mouse0'];
      delete Game.inputsClicked['Mouse0'];
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

Elements.TextButton = class extends Elements.Button {
  constructor(pos = new Vec2(), size = new Vec2(200, 50), onClick = null) {
    super(pos, size, onClick);
    this.text = 'Button';
    this.hoverText = 'Button';
    this.font = '32px Pixellari';
    this.drawOffset = new Vec2(0,0);
  }
  draw(ctx) {
    const pos = this.screenPos || this.getScreenPos();
    if (Game.debugToggles['drawHitboxes']) {
      ctx.fillStyle = this.hover ? 'white' : 'black';
      ctx.fillRect(pos.x, pos.y, this.size.x, this.size.y);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = this.font;
    Text.draw(ctx, (this.hover ? this.hoverText : this.text), pos.plus(this.size.times(0.5)).plus(this.drawOffset));
  }
}

Elements.MainMenuButton = class extends Elements.TextButton {
  constructor(pos=new Vec2(), onClick=null, text='Button', disabled=false) {
    super(pos, new Vec2(250, 55), onClick);
    this.disabled = disabled;
    if (this.disabled) {
      this.text = Text.parse("<color:rgb(127,127,127)><shadow:2,2,black>" + text);
      this.hoverText = Text.parse("<color:rgb(127,127,127)><shadow:2,2,black>" + text);
    } else {
      this.text = Text.parse("<color:rgb(255,255,255)><shadow:2,2,black>" + text);
      this.hoverText = Text.parse("<color:rgb(255,100,0)><shadow:2,2,black><shake:3>" + text);
    }
    this.font = "40px Pixellari";
    this.drawOffset = new Vec2(0,1);
    this.anchor = UI.anchor('center', 'center');
    this.pivot = UI.anchor('center', 'center');
  }
}
