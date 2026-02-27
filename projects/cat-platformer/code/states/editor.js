
import { Vec2 } from "../lib.js"
import { Game } from "../game.js"
import { EventBus } from "../core/eventBus.js"
import { World } from "../world/world.js"
import { WorldUtils } from "../world/utils.js"
import { WorldIO } from "../world/io.js"
import { UI } from "../ui/ui.js"
import { EditorElements } from "../ui/editor.js"

export const Editor = {
  PALETTE_HEIGHT: 70,
  SIDEBAR_WIDTH: 70,
  FILE_EXT: 'json',
  selectedTile: null,
  selectedPaletteIndex: 0,
  palette: [],
  erasing: false,
  lastAutosave: 0,
}

Editor.getFitPaletteIcons = function() {
  return Math.min(Editor.palette.length, Math.max(1, ((Game.canvas.width*(1/Game.dpr))-270)/70));
}

Editor.switchPalette = function(index) {
  Editor.selectedPaletteIndex = Math.min(index, Editor.getFitPaletteIcons()-1);
}

Editor.saveToFile = function() {
  console.log("Saving world to file...");
  try {
    const saveData = WorldIO.getSaveData();
    const jsonData = JSON.stringify(saveData);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${Game.id}_level.${Editor.FILE_EXT}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    EventBus.emit('editor:save:done', { time: Game.gameTime });
  } catch (err) {
    EventBus.emit('editor:save:error', { error: err });
    throw err;
  }
}

Editor.loadFromFile = async function() {
  console.log("Loading world from file...");
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{
        description: `${Game.name} Level File`,
        accept: {'application/json': [`.${Editor.FILE_EXT}`]},
      }]
    });
    const file = await fileHandle.getFile();
    const content = await file.text();
    const saveData = JSON.parse(content);
    const result = WorldIO.loadSaveData(saveData);
    if (result !== true) {
      EventBus.emit('editor:load:error', { reason: result });
      alert(`Failed to load world from file: ${result}`);
    } else {
      EventBus.emit('editor:load:done', { time: Game.gameTime });
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      if (error.name === 'SyntaxError') {
        EventBus.emit('editor:load:error', { reason: 'syntax' });
        alert("Failed to load world from file: not a valid json file");
      } else {
        EventBus.emit('editor:load:error', { error });
        alert(`Failed to load world from file: ${error}`);
      }
    }
  }
}

Editor.autosave = function() {
  const saveData = WorldIO.getSaveData();
  localStorage.setItem(`${Game.id}.autosave`, JSON.stringify(saveData));
  EventBus.emit('editor:autosave', { time: Game.gameTime });
}

Editor.bufferedAutosave = function() {
  if (Game.gameTime > Editor.lastAutosave + 1) {
    Editor.lastAutosave = Game.gameTime;
    Editor.autosave();
  }
}

Editor.zoomCamera = function(amount, pos) {
  const minZoom=0.25, maxZoom=4, snap=4, eps=0.05, base=1.005;
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

Editor.enter = function(payload) {
  UI.managers.editor = new UI.Manager();
  UI.managers.editor.paletteIcons = [];
  Editor.palette = Object.keys(World.tileInfo).filter(key => !World.tileInfo[key]?.hidden);

  Editor._eb_zoom = (p) => Editor.zoomCamera(p.amount, p.pos);
  Editor._eb_pan = (p) => Editor.panCamera(p.delta);
  Editor._eb_save = () => Editor.saveToFile();
  Editor._eb_load = () => Editor.loadFromFile();
  Editor._eb_switch_palette = (p) => Editor.switchPalette(p);

  EventBus.on('editor:zoom', Editor._eb_zoom);
  EventBus.on('editor:pan', Editor._eb_pan);
  EventBus.on('editor:save', Editor._eb_save);
  EventBus.on('editor:load', Editor._eb_load);
  EventBus.on('editor:switch_palette', Editor._eb_switch_palette);

  // back button
  UI.managers.editor.show('BackButton', () =>
    new EditorElements.BackButton(() => {
      EventBus.emit('state:request', 'main_menu');
      Editor.autosave();
    })
  );
  // erase button
  UI.managers.editor.show('erase_button', () =>
    new EditorElements.EraseButton()
  );
  // save button
  UI.managers.editor.show('save_button', () =>
    new EditorElements.SaveButton()
  );
  // load button
  UI.managers.editor.show('load_button', () =>
    new EditorElements.LoadButton()
  );
}

Editor.exit = function() {
  UI.managers.editor.destroyAll();
  delete UI.managers.editor;

  Game.cam = { zoom:Game.defaultCam.zoom, pos:Game.defaultCam.pos.clone(), anchor:Game.defaultCam.anchor.clone() };

  // unsubscribe from eventbus
  EventBus.off('editor:zoom', Editor._eb_zoom);
  EventBus.off('editor:pan', Editor._eb_pan);
  EventBus.off('editor:save', Editor._eb_save);
  EventBus.off('editor:load', Editor._eb_load);

  Editor._eb_zoom = null;
  Editor._eb_pan = null;
  Editor._eb_save = null;
  Editor._eb_load = null;
}

Editor.update = function(dt) {
  for (let i = 0; i < 10; i++) {
    if (Game.inputsClicked[`Digit${i+1}`]) {
      EventBus.emit('editor:switch_palette', i);
    }
  }
  if (Game.inputsClicked['Digit0']) {
    EventBus.emit('editor:switch_palette', 9);
  }
  Editor.selectedTile = Editor.palette[Editor.selectedPaletteIndex];

  // pan
  if (Game.inputs['Mouse2'] || Game.inputsClicked['Mouse2']) {
    EventBus.emit('editor:pan', { delta: Game.mouseVel.divided(Game.cam.zoom) });
  }
  if (Game.inputsClicked['pan']) {
    EventBus.emit('editor:pan', { delta: Game.inputsClicked['pan'] });
  }
  if (Game.keybinds['editorCamUp']) EventBus.emit('editor:pan', { delta: new Vec2(0,4) });
  if (Game.keybinds['editorCamDown']) EventBus.emit('editor:pan', { delta: new Vec2(0,-4) });
  if (Game.keybinds['editorCamLeft']) EventBus.emit('editor:pan', { delta: new Vec2(4,0) });
  if (Game.keybinds['editorCamRight']) EventBus.emit('editor:pan', { delta: new Vec2(-4,0) });

  // zoom
  if (Game.inputsClicked['scroll']) {
    EventBus.emit('editor:zoom', { amount: Game.inputsClicked['scroll'], pos: Game.mousePos });
  }
  if (Game.keybinds['editorZoomIn']) {
    EventBus.emit('editor:zoom', { amount: -8, pos: new Vec2(Game.canvas.width/2*(1/Game.dpr),Game.canvas.height/2*(1/Game.dpr)) });
  }
  if (Game.keybinds['editorZoomOut']) {
    EventBus.emit('editor:zoom', { amount: 8, pos: new Vec2(Game.canvas.width/2*(1/Game.dpr),Game.canvas.height/2*(1/Game.dpr)) });
  }

  // erasing toggle logic
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
  if (Game.inputsClicked['KeyE']) Editor.erasing = !Editor.erasing;

  // place/erase tiles
  const prevMousePos = Game.prevMousePos ?? Game.mousePos;
  if (Game.mousePos &&
    ((Game.inputs['Mouse0'] || Game.inputsClicked['Mouse0']) || (Game.inputs['Mouse1'] || Game.inputsClicked['Mouse1'])) &&
    Game.mousePos.x > 0 &&
    Game.mousePos.x < Game.canvas.width*(1/Game.dpr) - Editor.SIDEBAR_WIDTH &&
    Game.mousePos.y > Editor.PALETTE_HEIGHT &&
    Game.mousePos.y < Game.canvas.height*(1/Game.dpr)
  ) {
    if (Editor.erasing) {
      WorldUtils.getIntersectingTiles(WorldUtils.getGamePos(prevMousePos), WorldUtils.getGamePos(Game.mousePos)).forEach(tilepos => {
        Object.values(World.layers).forEach(layer => {
          World.setTileAt(tilepos, layer, null);
        });
      });
    } else if (Editor.selectedTile) {
      WorldUtils.getIntersectingTiles(WorldUtils.getGamePos(prevMousePos), WorldUtils.getGamePos(Game.mousePos)).forEach(tilepos => {
        if (World.tileInfo[Editor.selectedTile]?.layer) {
          World.setTileAt(tilepos, World.tileInfo[Editor.selectedTile]?.layer, Editor.selectedTile);
        } else {
          World.setTileAt(tilepos, 0, Editor.selectedTile);
        }
      });
    }
    Editor.bufferedAutosave();
  }

  // always show correct amount of palette icons
  const fitPaletteIcons = Editor.getFitPaletteIcons();
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
        new EditorElements.PaletteIcon(i)
      );
      UI.managers.editor.paletteIcons.push(UI.managers.editor.elements[`PaletteIcon_${i}`]);
    }
  }

  UI.managers.editor && UI.managers.editor.tick && UI.managers.editor.tick();
}

Editor.draw = function(ctx) {
  const canvas = Game.canvas;
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