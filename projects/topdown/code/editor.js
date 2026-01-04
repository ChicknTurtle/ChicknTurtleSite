
const Editor = {
  PALETTE_HEIGHT: 70,
  SIDEBAR_WIDTH: 70,
  FILE_EXT: 'topdownworld',
  cam: { zoom:1, pos:new Vec2(0) },
  selectedTile: 'grass',
  selectedPaletteIndex: 0,
  palette: Object.keys(World.tileInfo),
  isEditing: false,
  erasing: false,
  UI: {},
  lastAutosave: 0,
}

Editor.saveToFile = function() {
  console.log("Saving world to file...");
  const saveData = WorldIO.getSaveData();
  const jsonData = JSON.stringify(saveData);  
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `World.${Editor.FILE_EXT}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

Editor.loadFromFile = async function() {
  console.log("Loading world from file...");
  try {
    const [fileHandle] = await window.showOpenFilePicker({
        types: [{
            description: 'Topdown World File',
            accept: {'application/json': [`.${Editor.FILE_EXT}`]},
        }]
    });
    const file = await fileHandle.getFile();
    const content = await file.text();
    const saveData = JSON.parse(content);
    const result = WorldIO.loadSaveData(saveData);
    if (result !== true) {
      alert(`Failed to load world from file: ${result}`);
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      if (error.name === 'SyntaxError') {
        alert("Failed to load world from file: not a valid json file")
      } else {
        alert(`Failed to load world from file: ${error}`);
      }
    }
  }
}

Editor.autosave = function() {
  const saveData = WorldIO.getSaveData();
  localStorage.setItem(`${Game.id}.autosave`, JSON.stringify(saveData));
}

Editor.bufferedAutosave = function() {
  if (Game.gameTime > Editor.lastAutosave + 1) {
    Editor.lastAutosave = Game.gameTime;
    Editor.autosave();
  }
}

Editor.zoomCamera = function(amount, pos) {
  const minZoom=0.5, maxZoom=6, snap=4, eps=0.05, base=1.005;
  let z1 = Game.cam.zoom * Math.pow(base, -amount);
  if (Math.abs(z1 - snap) < eps) z1 = snap;
  z1 = Math.max(minZoom, Math.min(maxZoom, z1));
  const f = ((1 / z1) - (1 / Game.cam.zoom));
  Game.cam.pos.subtract(pos.times(f));
  Game.cam.zoom = z1;
}

Editor.panCamera = function(delta) {
  Game.cam.pos.subtract(delta);
}

Editor.tick = function() {
  // define ui
  if (!UI.managers.editor) {
    UI.managers.editor = new UI.Manager();
    UI.managers.editor.paletteIcons = [];
  }
  // back button
  if (!UI.managers.editor.elements['BackButton']) {
    UI.managers.editor.show('BackButton', () =>
      new Editor.UI.BackButton()
    );
  }
  // erase button
  if (!UI.managers.editor.elements['erase_button']) {
    UI.managers.editor.show('erase_button', () =>
      new Editor.UI.EraseButton()
    );
  }
  // save button
  if (!UI.managers.editor.elements['save_button']) {
    UI.managers.editor.show('save_button', () =>
      new Editor.UI.SaveButton()
    );
  }
  // load button
  if (!UI.managers.editor.elements['load_button']) {
    UI.managers.editor.show('load_button', () =>
      new Editor.UI.LoadButton()
    );
  }
  // always show correct amount of palette icons
  const fitPaletteIcons = Math.min(Object.keys(World.tileInfo).length, Math.max(1, ((Game.canvas.width*(1/Game.dpr))-270)/70));
  // delete extra
  UI.managers.editor.paletteIcons.forEach(element => {
    if (element.index > fitPaletteIcons) {
      UI.managers.editor.destroy(`PaletteIcon_${element.index}`);
    }
  });
  UI.managers.editor.paletteIcons = UI.managers.editor.paletteIcons.filter(element => element.index <= fitPaletteIcons);
  // create needed
  for (let i = 0; i < fitPaletteIcons; i++) {
    if (!UI.managers.editor.elements[`PaletteIcon_${i}`]) {
      UI.managers.editor.show(`PaletteIcon_${i}`, () =>
        new Editor.UI.PaletteIcon(i)
      );
      UI.managers.editor.paletteIcons.push(UI.managers.editor.elements[`PaletteIcon_${i}`]);
    }
  }

  // ui controls

  if (Editor.isEditing) {
    // select tile
    for (let i = 0; i < 10; i++) {
      if (Game.inputsClicked[`Digit${i+1}`] && i < fitPaletteIcons) {
        Editor.selectedPaletteIndex = i;
      }
    }
    if (Game.inputsClicked['Digit0'] && 10 < fitPaletteIcons) {
      Editor.selectedPaletteIndex = 9;
    }
    Editor.selectedPaletteIndex = Math.min(Editor.selectedPaletteIndex, fitPaletteIcons)
    Editor.selectedTile = Editor.palette[Editor.selectedPaletteIndex];

    // pan
    if (Game.inputs['Mouse2'] || Game.inputsClicked['Mouse2']) {
      Editor.panCamera(Game.mouseVel.divided(Game.cam.zoom));
    }
    if (Game.inputsClicked['pan']) {
      Editor.panCamera(Game.inputsClicked['pan']);
    }
    if (Game.inputs['KeyW']) {
      Editor.panCamera(new Vec2(0,4));
    }
    if (Game.inputs['KeyS']) {
      Editor.panCamera(new Vec2(0,-4));
    }
    if (Game.inputs['KeyA']) {
      Editor.panCamera(new Vec2(4,0));
    }
    if (Game.inputs['KeyD']) {
      Editor.panCamera(new Vec2(-4,0));
    }
    // zoom
    if (Game.inputsClicked['scroll']) {
      Editor.zoomCamera(Game.inputsClicked['scroll'], Game.mousePos);
    }
    if (Game.inputs['Equal']) {
      Editor.zoomCamera(-8, new Vec2(Game.canvas.width/2,Game.canvas.height/2*(1/Game.dpr)));
    }
    if (Game.inputs['Minus']) {
      Editor.zoomCamera(8, new Vec2(Game.canvas.width/2,Game.canvas.height/2*(1/Game.dpr)));
    }

    // detect erasing
    if (
      !(Game.inputs['Mouse2'] || Game.inputsClicked['Mouse2']) &&
      ((Game.inputs['Mouse1'] || Game.inputsClicked['Mouse1']) ||
      (Game.inputs['ShiftLeft'] || Game.inputs['ShiftRight']))
    ) {
      Editor.erasing = true;
    }
    if (
      Game.inputsReleased['ShiftLeft'] ||
      Game.inputsReleased['ShiftRight'] ||
      Game.inputsReleased['Mouse1'] ||
      Game.inputsClicked['KeyB']
    ) {
      Editor.erasing = false;
    }
    if (Game.inputsClicked['KeyE']) {
      Editor.erasing = !Editor.erasing;
    }

    // place/erase tiles
    if (Game.mousePos && Game.prevMouseGamePos &&
      ((Game.inputs['Mouse0'] || Game.inputsClicked['Mouse0']) || (Game.inputs['Mouse1'] || Game.inputsClicked['Mouse1'])) &&
      Game.mousePos.x > 0 &&
      Game.mousePos.x < Game.canvas.width*(1/Game.dpr) - Editor.SIDEBAR_WIDTH &&
      Game.mousePos.y > Editor.PALETTE_HEIGHT &&
      Game.mousePos.y < Game.canvas.height*(1/Game.dpr)
    ) {
      if (Editor.erasing) {
        World.getIntersectingTiles(Game.prevMouseGamePos, World.getGamePos(Game.mousePos)).forEach(tilepos => {
          World.setTileAt(tilepos, World.layers.FLOOR, null);
          World.setTileAt(tilepos, World.layers.OBJECTS, null);
          World.setTileAt(tilepos, World.layers.ROOF, null);
        });
      } else if (Editor.selectedTile) {
        World.getIntersectingTiles(Game.prevMouseGamePos, World.getGamePos(Game.mousePos)).forEach(tilepos => {
          if (World.tileInfo[Editor.selectedTile]?.floor === true) {
            World.setTileAt(tilepos, World.layers.FLOOR, Editor.selectedTile);
          } else {
            World.setTileAt(tilepos, World.layers.OBJECTS, Editor.selectedTile);
          }
        });
      }
      Editor.bufferedAutosave()
    }
  }

  UI.managers.editor.tick();
}

Editor.draw = function(ctx) {
  const canvas = Game.canvas;
  if (Editor.isEditing) {
    // palette bg
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.fillRect(0, 0, canvas.width*(1/Game.dpr), Editor.PALETTE_HEIGHT);
    // sidebar bg
    ctx.fillStyle = 'rgba(100,100,100,0.5)';
    ctx.fillRect(canvas.width*(1/Game.dpr)-Editor.SIDEBAR_WIDTH, Editor.PALETTE_HEIGHT, Editor.SIDEBAR_WIDTH, 3);
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.fillRect(canvas.width*(1/Game.dpr)-Editor.SIDEBAR_WIDTH, Editor.PALETTE_HEIGHT+3, Editor.SIDEBAR_WIDTH, canvas.height*(1/Game.dpr)-Editor.PALETTE_HEIGHT-3);
    // ui
    UI.managers.editor.draw(ctx);
  }
}

Editor.UI.EraseButton = class extends UI.Button {
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
      ctx.drawImage(Game.spritesheets['editor'], 52, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.spritesheets['editor'], 26, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.spritesheets['editor'], 0, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    }
    // icon
    ctx.drawImage(Game.spritesheets['editor'], 0, 52, 15, 15, Math.floor(this.pos.x+12.5), Math.floor(this.pos.y+11), 15*2, 15*2);
  }
}

Editor.UI.SaveButton = class extends UI.Button {
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
      ctx.drawImage(Game.spritesheets['editor'], 52, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.spritesheets['editor'], 26, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.spritesheets['editor'], 0, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    }
    // icon
    ctx.drawImage(Game.spritesheets['editor'], 15, 52, 15, 15, Math.floor(this.pos.x+12.5), Math.floor(this.pos.y+11), 15*2, 15*2);
  }
}

Editor.UI.LoadButton = class extends UI.Button {
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
      ctx.drawImage(Game.spritesheets['editor'], 52, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.spritesheets['editor'], 26, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.spritesheets['editor'], 0, 26, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    }
    // icon
    ctx.drawImage(Game.spritesheets['editor'], 30, 52, 15, 15, Math.floor(this.pos.x+12.5), Math.floor(this.pos.y+11), 15*2, 15*2);
  }
}

Editor.UI.BackButton = class extends UI.Button {
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
        Game.state = 'main_menu';
        Editor.isEditing = false;
        Game.cam = { zoom:Game.defaultZoom, pos:new Vec2(0) };
        Editor.autosave();
        delete Game.inputs['Mouse0'];
        delete Game.inputsClicked['Mouse0'];
      }
    }
  }
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    // box
    if (this.hover) {
      ctx.drawImage(Game.spritesheets['editor'], 79, 25, 24, 24, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.spritesheets['editor'], 79, 0, 24, 24, this.pos.x, this.pos.y, this.size.x, this.size.y);
    }
  }
}

Editor.UI.PaletteIcon = class extends UI.Button {
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
      ctx.drawImage(Game.spritesheets['editor'], 52, 0, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else if (this.hover) {
      ctx.drawImage(Game.spritesheets['editor'], 26, 0, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else {
      ctx.drawImage(Game.spritesheets['editor'], 0, 0, 26, 26, this.pos.x, this.pos.y, this.size.x, this.size.y);
    }
    // icon
    const tile = Editor.palette[this.index];
    const tilesetPos = World.tileInfo[tile]?.pos?.times(World.TILE_SIZE) || new Vec2(0,0);
    if (World.tileInfo[tile]?.useAutoTile) {
      tilesetPos.add(new Vec2(World.TILE_SIZE*3, World.TILE_SIZE*3));
    }
    ctx.drawImage(Game.spritesheets['tileset'], tilesetPos.x, tilesetPos.y, World.TILE_SIZE, World.TILE_SIZE, Math.floor(this.pos.x+8), Math.floor(this.pos.y+8), 38, 38);
    // text
    ctx.imageSmoothingEnabled = true;
    if (this.index <= 9) {
      ctx.fillStyle = 'white';
      ctx.font = `${this.size.y*0.5}px Pixellari`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      const c = new Text.Component(this.index === 9 ? '0' : this.index+1);
      c.effects.shadow.pos.x = 2;
      c.effects.shadow.pos.y = 2;
      Text.draw(ctx, c, this.pos.plus(new Vec2(-4,this.size.y+4)));
    }
  }
}
