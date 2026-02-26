
import { Vec2 } from "./../lib.js"
import { Game } from "./../game.js"
import { EventBus } from "./../core/eventBus.js"
import { Elements } from "./elements.js"
import { Editor } from "./../editor.js"
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
        Editor.saveToFile();
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
        Editor.loadFromFile();
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
  constructor() {
    super(new Vec2(), new Vec2(54,54));
  }
  tick() {
    this.pos.x = 7;
    this.pos.y = 9;
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
        EventBus.emit('state:request', 'main_menu');
        Game.cam = { zoom:Game.defaultCam.zoom, pos:Game.defaultCam.pos.clone(), anchor:Game.defaultCam.anchor.clone() };
        Editor.autosave();
      }
    }
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    // box
    if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 79, 25, 24, 24, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 79, 0, 24, 24, this.pos.x, this.pos.y, this.size.x, this.size.y);
    }
  }
}

EditorElements.PaletteIcon = class extends Elements.Button {
  constructor(index=0) {
    super(new Vec2(), new Vec2(54,54));
    this.index = index;
  }
  tick() {
    this.pos.x = 150+this.index*70;
    this.pos.y = 9;
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
        Editor.selectedPaletteIndex = this.index;
      }
    }
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    // box
    if (Editor.selectedPaletteIndex === this.index) {
      ctx.drawImage(Game.textures['editor'], 52, 0, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 26, 0, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 0, 0, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    }
    // icon
    const tile = Editor.palette[this.index];
    const tilesetPos = World.tileInfo[tile]?.pos?.times(World.TILE_SIZE) || new Vec2(0,0);
    if (World.tileInfo[tile]?.useAutoTile) {
      tilesetPos.add(new Vec2(World.TILE_SIZE*3, World.TILE_SIZE*3));
    }
    ctx.drawImage(Game.textures['tiles'], tilesetPos.x, tilesetPos.y, World.TILE_SIZE, World.TILE_SIZE, Math.floor(this.pos.x+8), Math.floor(this.pos.y+8), 38, 38);
    // text
    ctx.imageSmoothingEnabled = true;
    if (this.index <= 9) {
      ctx.fillStyle = 'white';
      ctx.font = `${this.size.y*0.5}px Pixellari`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      const digit = this.index === 9 ? '0' : this.index+1;
      Text.parse(`<shadow:2,2,black>${digit}`).draw(ctx, this.pos.plus(new Vec2(-4,this.size.y+4)))
    }
  }
}
