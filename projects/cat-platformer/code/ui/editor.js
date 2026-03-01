
import { Vec2 } from "./../lib.js"
import { Game } from "./../game.js"
import { EventBus } from "./../core/eventBus.js"
import { Elements } from "./elements.js"
import { Editor } from "../states/editor.js"
import { World } from "./../world/world.js"
import { Text } from "./../text.js"

export const EditorElements = {}

EditorElements.EraseButton = class extends Elements.Button {
  constructor() {
    super(new Vec2(), new Vec2(54,54));
  }
  tick() {
    this.pos.x = Game.canvas.width*(1/Game.dpr)-63;
    this.pos.y = 190;
    this.hover = false;
    if (Game.mousePos) {
      const pos = Game.mousePos;
      this.hover = (
        pos.x >= this.pos.x &&
        pos.x <= this.pos.x + this.size.x &&
        pos.y >= this.pos.y &&
        pos.y <= this.pos.y + this.size.y
      )
      if (this.hover && Game.inputsClicked['Mouse0']) {
        Editor.erasing = !Editor.erasing;
      }
    }
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    // button
    if (Editor.erasing) {
      ctx.drawImage(Game.textures['editor'], 52, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 26, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 0, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    }
    // icon
    ctx.drawImage(Game.textures['editor'], 0, 52, 15, 15, Math.floor(this.pos.x+12.5), Math.floor(this.pos.y+11), 15*2, 15*2);
  }
}

EditorElements.SaveButton = class extends Elements.Button {
  constructor() {
    super(new Vec2(), new Vec2(54,54));
  }
  tick() {
    this.pos.x = Game.canvas.width*(1/Game.dpr)-63;
    this.pos.y = 250;
    this.hover = false;
    if (Game.mousePos) {
      const pos = Game.mousePos;
      this.hover = (
        pos.x >= this.pos.x &&
        pos.x <= this.pos.x + this.size.x &&
        pos.y >= this.pos.y &&
        pos.y <= this.pos.y + this.size.y
      )
      if (this.hover && Game.inputsClicked['Mouse0']) {
        EventBus.emit('worldio:save_to_file');
      }
    }
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    // button
    if (this.hover && Game.inputs['Mouse0']) {
      ctx.drawImage(Game.textures['editor'], 52, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 26, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 0, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    }
    // icon
    ctx.drawImage(Game.textures['editor'], 15, 52, 15, 15, Math.floor(this.pos.x+12.5), Math.floor(this.pos.y+11), 15*2, 15*2);
  }
}

EditorElements.LoadButton = class extends Elements.Button {
  constructor() {
    super(new Vec2(), new Vec2(54,54));
  }
  tick() {
    this.pos.x = Game.canvas.width*(1/Game.dpr)-63;
    this.pos.y = 310;
    this.hover = false;
    if (Game.mousePos) {
      const pos = Game.mousePos;
      this.hover = (
        pos.x >= this.pos.x &&
        pos.x <= this.pos.x + this.size.x &&
        pos.y >= this.pos.y &&
        pos.y <= this.pos.y + this.size.y
      )
      if (this.hover && Game.inputsClicked['Mouse0']) {
        EventBus.emit('worldio:load_from_file');
      }
    }
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    // button
    if (this.hover && Game.inputs['Mouse0']) {
      ctx.drawImage(Game.textures['editor'], 52, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 26, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 0, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    }
    // icon
    ctx.drawImage(Game.textures['editor'], 30, 52, 15, 15, Math.floor(this.pos.x+12.5), Math.floor(this.pos.y+11), 15*2, 15*2);
  }
}

EditorElements.BackButton = class extends Elements.Button {
  constructor(onClick=null) {
    super(new Vec2(7,9), new Vec2(54,54), onClick);
    this.anchor = new Vec2(0,0);
    this.pivot = new Vec2(0,0);
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const pos = this.getScreenPos();
    // box
    if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 79, 25, 24, 24, pos.x, pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 79, 0, 24, 24, pos.x, pos.y, this.size.x, this.size.y);
    }
  }
}

EditorElements.PlayButton = class extends Elements.Button {
  constructor(onClick=null) {
    super(new Vec2(-7,-9), new Vec2(54,54), onClick);
    this.anchor = new Vec2(1,1);
    this.pivot = new Vec2(1,1);
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const pos = this.getScreenPos();
    // box
    if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 104, 25, 24, 24, pos.x, pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 104, 0, 24, 24, pos.x, pos.y, this.size.x, this.size.y);
    }
  }
}

EditorElements.PaletteIcon = class extends Elements.Button {
  constructor(index=0) {
    super(new Vec2(), new Vec2(54,54));
    this.index = index;
    this.pos.x = 100+this.index*60;
    this.pos.y = 9;
    this.anchor = new Vec2(0,0);
    this.pivot = new Vec2(0,0);
    this.onClick = () => {
      EventBus.emit('editor:switch_palette', this.index);
    }
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const pos = this.getScreenPos();
    // box
    if (Editor.selectedPaletteIndex === this.index) {
      ctx.drawImage(Game.textures['editor'], 52, 0, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 26, 0, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 0, 0, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    }
    // icon
    const tile = Editor.palette[this.index];
    if (tile.type === 'tile') {
      const tilesetPos = World.tileInfo[tile.id]?.pos?.times(World.TILE_SIZE) || new Vec2(0,0);
      ctx.drawImage(Game.textures['tiles'], tilesetPos.x, tilesetPos.y, World.TILE_SIZE, World.TILE_SIZE, Math.floor(pos.x+8), Math.floor(pos.y+8), 38, 38);
    } else if (tile.type === 'entity') {
      const icon = Game.entities[tile.id]?.icon;
      if (icon) {
        ctx.drawImage(Game.textures[icon.texture], icon.pos.x, icon.pos.y, icon.size.x, icon.size.y, Math.floor(pos.x+8), Math.floor(pos.y+8), 38, 38);
      }
    }
    // text
    ctx.imageSmoothingEnabled = true;
    if (this.index <= 9) {
      ctx.fillStyle = 'white';
      ctx.font = `${this.size.y*0.5}px Pixellari`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      const digit = this.index === 9 ? '0' : this.index+1;
      Text.parse(`<shadow:2,2,black>${digit}`).draw(ctx, pos.plus(new Vec2(-4,this.size.y+4)))
    }
  }
}
