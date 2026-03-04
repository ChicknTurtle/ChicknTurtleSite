
import { Vec2 } from "../utils/lib.js"
import { Game } from "./../game.js"
import { EventBus } from "./../core/eventBus.js"
import { StateManager } from "./../core/stateManager.js"
import { Elements } from "./elements.js"
import { Editor } from "../states/editor.js"
import { World } from "./../world/world.js"
import { Text } from "./../text.js"
import { UI } from "./ui.js"
import { drawNineSlice } from "../utils/rendering.js"

export const EditorElements = {}

EditorElements.EraseButton = class extends Elements.Button {
  constructor() {
    super(new Vec2(-11,190), new Vec2(52,52));
    this.anchor = new Vec2(1,0);
    this.pivot = new Vec2(1,0);
    this.onClick = () => {
      Editor.erasing = !Editor.erasing;
    }
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const pos = this.getScreenPos();
    // button
    if (Editor.erasing) {
      ctx.drawImage(Game.textures['editor'], 52, 26, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 26, 26, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 0, 26, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    }
    // icon
    ctx.drawImage(Game.textures['editor'], 0, 52, 15, 15, pos.x+11, pos.y+11, 30, 30);
  }
}

EditorElements.SaveButton = class extends Elements.Button {
  constructor() {
    super(new Vec2(-11,250), new Vec2(52,52));
    this.anchor = new Vec2(1,0);
    this.pivot = new Vec2(1,0);
    this.onClick = () => {
      EventBus.emit('worldio:save_to_file');
    }
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const pos = this.getScreenPos();
    // button
    if (this.hover && Game.inputs['Mouse0']) {
      ctx.drawImage(Game.textures['editor'], 52, 26, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 26, 26, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 0, 26, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    }
    // icon
    ctx.drawImage(Game.textures['editor'], 15, 52, 15, 15, pos.x+11, pos.y+11, 30, 30);
  }
}

EditorElements.LoadButton = class extends Elements.Button {
  constructor() {
    super(new Vec2(-11,310), new Vec2(52,52));
    this.anchor = new Vec2(1,0);
    this.pivot = new Vec2(1,0);
    this.onClick = () => {
      EventBus.emit('worldio:load_from_file');
    }
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const pos = this.getScreenPos();
    // button
    if (this.hover && Game.inputs['Mouse0']) {
      ctx.drawImage(Game.textures['editor'], 52, 26, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 26, 26, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 0, 26, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    }
    // icon
    ctx.drawImage(Game.textures['editor'], 30, 52, 15, 15, pos.x+11, pos.y+11, 30, 30);
  }
}

EditorElements.BackButton = class extends Elements.Button {
  constructor(onClick=null) {
    super(new Vec2(7,9), new Vec2(48,48), onClick);
    this.anchor = new Vec2(0,0);
    this.pivot = new Vec2(0,0);
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const pos = this.getScreenPos();
    if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 79, 25, 24, 24, pos.x, pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 79, 0, 24, 24, pos.x, pos.y, this.size.x, this.size.y);
    }
  }
}

EditorElements.PlayButton = class extends Elements.Button {
  constructor(onClick=null) {
    super(new Vec2(-11,-11), new Vec2(52,52), onClick);
    this.anchor = new Vec2(1,1);
    this.pivot = new Vec2(1,1);
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const pos = this.getScreenPos();
    if (StateManager.current === 'editor_gameplay') {
      if (this.hover) {
        ctx.drawImage(Game.textures['editor'], 129, 25, 24, 24, pos.x, pos.y, this.size.x, this.size.y);
      } else {
        ctx.drawImage(Game.textures['editor'], 129, 0, 24, 24, pos.x, pos.y, this.size.x, this.size.y);
      }
    } else {
      if (this.hover) {
        ctx.drawImage(Game.textures['editor'], 104, 25, 24, 24, pos.x, pos.y, this.size.x, this.size.y);
      } else {
        ctx.drawImage(Game.textures['editor'], 104, 0, 24, 24, pos.x, pos.y, this.size.x, this.size.y);
      }
    }
  }
}

EditorElements.HotbarIcon = class extends Elements.Button {
  constructor(index=0) {
    super(new Vec2(), new Vec2(52,52));
    this.index = index;
    this.pos.x = -100-this.index*60;
    this.pos.y = 10;
    this.anchor = new Vec2(1,0);
    this.pivot = new Vec2(1,0);
    this.onClick = () => {
      EventBus.emit('editor:switch_hotbar', this.index);
    }
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const pos = this.getScreenPos();
    // box
    if (Editor.selectedHotbarIndex === this.index) {
      ctx.drawImage(Game.textures['editor'], 52, 0, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 26, 0, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 0, 0, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    }
    // icon
    const tile = Editor.hotbar[this.index];
    if (tile.type === 'tile') {
      const tilesetPos = World.tileInfo[tile.id]?.pos?.times(World.TILE_SIZE) || new Vec2(0,0);
      ctx.drawImage(Game.textures['tiles'], tilesetPos.x, tilesetPos.y, World.TILE_SIZE, World.TILE_SIZE, pos.x+10, pos.y+10, 32, 32);
    } else if (tile.type === 'entity') {
      const icon = Game.entities[tile.id]?.icon;
      if (icon) {
        ctx.drawImage(Game.textures[icon.texture], icon.pos.x, icon.pos.y, icon.size.x, icon.size.y, pos.x+10, pos.y+10, 32, 32);
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

EditorElements.PaletteButton = class extends Elements.Button {
  constructor(onClick=null) {
    super(new Vec2(-12,10), new Vec2(54,54), onClick);
    this.anchor = new Vec2(1,0);
    this.pivot = new Vec2(1,0);
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const pos = this.getScreenPos();
    if (Editor.viewingPalette) {
      if (this.hover) {
        ctx.drawImage(Game.textures['editor'], 182, 28, 27, 27, pos.x, pos.y, this.size.x, this.size.y);
      } else {
        ctx.drawImage(Game.textures['editor'], 182, 0, 27, 27, pos.x, pos.y, this.size.x, this.size.y);
      }
    } else {
      if (this.hover) {
        ctx.drawImage(Game.textures['editor'], 154, 28, 27, 27, pos.x, pos.y, this.size.x, this.size.y);
      } else {
        ctx.drawImage(Game.textures['editor'], 154, 0, 27, 27, pos.x, pos.y, this.size.x, this.size.y);
      }
    }
  }
}

EditorElements.PaletteBackground = class extends Elements.Element {
  constructor() {
    super(new Vec2(-Editor.SIDEBAR_WIDTH-2,Editor.SIDEBAR_HEIGHT+2), new Vec2(Editor.PALETTE_WIDTH,0));
    this.anchor = new Vec2(1,0);
    this.pivot = new Vec2(1,0);
  }
  tick() {
    super.tick();
    if (!Editor.viewingPalette) {
      Editor.palette.forEach((tile, idx) => {
        UI.managers.editor.destroy(`PaletteMenuButton_${idx}`);
      })
      return;
    };
    this.size.y = Game.canvas.height/Game.dpr-Editor.SIDEBAR_HEIGHT+8;
    Editor.palette.forEach((tile, idx) => {
      if (!UI.managers.editor.elements[`PaletteMenuButton_${idx}`]) {
        UI.managers.editor.show(`PaletteMenuButton_${idx}`, () =>
          new EditorElements.PaletteMenuButton(idx)
        );
      } else {
        UI.managers.editor.elements[`PaletteMenuButton_${idx}`].tile = tile;
      }
    })
  }
  draw(ctx) {
    if (!Editor.viewingPalette) return;
    ctx.imageSmoothingEnabled = false;
    const pos = this.getScreenPos();
    drawNineSlice(ctx, Game.textures['editor'], 24, 24, [4,4,4,4], pos.x, pos.y, this.size.x, this.size.y, 157, 56, 2);
  }
}

EditorElements.PaletteMenuButton = class extends Elements.Button {
  constructor(index=0) {
    super(new Vec2(), new Vec2(52,52));
    this.index = index;
    this.tile = Editor.palette[index];
    this.anchor = new Vec2(1,0);
    this.pivot = new Vec2(1,0);
    this.updatePos();
    this.onClick = () => {
      const idx = Editor.hotbar.findIndex(t => t && t.type === this.tile.type && t.id === this.tile.id);
      if (idx !== -1) {
        Editor.moveHotbarIndexToFront(idx);
      } else {
        Editor.hotbar.unshift(this.tile);
        Editor.selectedHotbarIndex = 0;
        Editor.selectedTile = Editor.hotbar[0];
      }
      Editor.viewingPalette = false;
    }
  }
  updatePos() {
    const columns = Math.floor((Editor.PALETTE_WIDTH-4) / 52);
    this.pos.x = -Editor.SIDEBAR_WIDTH - Editor.PALETTE_WIDTH + 4 + (this.index%columns)*52+52;
    this.pos.y = Editor.SIDEBAR_HEIGHT + 8 + Math.floor(this.index/columns)*52;
  }
  tick() {
    super.tick();
    this.updatePos();
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const pos = this.getScreenPos();
    // box
    if (this.hover) {
      ctx.drawImage(Game.textures['editor'], 26, 0, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.textures['editor'], 0, 0, 26, 26, pos.x, pos.y, this.size.x, this.size.y);
    }
    // icon
    if (this.tile.type === 'tile') {
      const tilesetPos = World.tileInfo[this.tile.id]?.pos?.times(World.TILE_SIZE) || new Vec2(0,0);
      ctx.drawImage(Game.textures['tiles'], tilesetPos.x, tilesetPos.y, World.TILE_SIZE, World.TILE_SIZE, pos.x+10, pos.y+10, 32, 32);
    } else if (this.tile.type === 'entity') {
      const icon = Game.entities[this.tile.id]?.icon;
      if (icon) {
        ctx.drawImage(Game.textures[icon.texture], icon.pos.x, icon.pos.y, icon.size.x, icon.size.y, pos.x+10, pos.y+10, 32, 32);
      }
    }
  }
}
