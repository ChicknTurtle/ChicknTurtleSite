
import { Vec2 } from "../lib.js"
import { Game } from "../game.js"
import { EventBus } from "../core/eventBus.js"
import { World } from "../world/world.js"
import { WorldUtils } from "../world/utils.js"
import { UI } from "../ui/ui.js"
import { EditorElements } from "../ui/editor.js"

export const Editor = {
  PALETTE_HEIGHT: 70,
  SIDEBAR_WIDTH: 70,
  selectedTile: null,
  selectedPaletteIndex: 0,
  palette: [
    { type:'tile', id:'wall' },
    { type:'tile', id:'grass' },
    { type:'tile', id:'dirt' },
    { type:'tile', id:'platform' },
    { type:'tile', id:'wall_metal' },
    { type:'tile', id:'wall_dirt' },
    { type:'tile', id:'gold' },
    { type:'tile', id:'ruby' },
    { type:'tile', id:'diamond' },
    { type:'tile', id:'emerald' },
    { type:'tile', id:'bush' },
    { type:'entity', id:'player' },
    { type:'entity', id:'coin' },
  ],
  erasing: false,
  showGrid: true,
  lastAutosave: 0,
}

Editor.getFitPaletteIcons = function() {
  return Math.floor(Math.min(Editor.palette.length, Math.max(1, ((Game.canvas.width*(1/Game.dpr))-180)/60)));
}

Editor.switchPalette = function(index) {
  Editor.selectedPaletteIndex = Math.min(index, Editor.getFitPaletteIcons()-1);
}

Editor.bufferedAutosave = function(force=false) {
  if (force || Game.gameTime > Editor.lastAutosave + 1) {
    Editor.lastAutosave = Game.gameTime;
    EventBus.emit('worldio:autosave');
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
  Editor.selectedPaletteIndex = 0;

  Editor._eb_zoom = (p) => Editor.zoomCamera(p.amount, p.pos);
  Editor._eb_pan = (p) => Editor.panCamera(p.delta);
  Editor._eb_autosave = (p) => Editor.bufferedAutosave(p);
  Editor._eb_switch_palette = (p) => Editor.switchPalette(p);

  EventBus.on('editor:zoom', Editor._eb_zoom);
  EventBus.on('editor:pan', Editor._eb_pan);
  EventBus.on('editor:autosave', Editor._eb_autosave);
  EventBus.on('editor:switch_palette', Editor._eb_switch_palette);

  // back button
  UI.managers.editor.show('BackButton', () =>
    new EditorElements.BackButton(() => {
      EventBus.emit('worldio:autosave');
      EventBus.emit('state:request', 'main_menu');
    })
  );
  // play button
  UI.managers.editor.show('PlayButton', () =>
    new EditorElements.PlayButton(() => {
      EventBus.emit('worldio:autosave');
      EventBus.emit('state:request', 'editor_gameplay');
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

  // toggle grid
  if (Game.keybindsClicked['editorToggleGrid']) Editor.showGrid = !Editor.showGrid;

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
    } else {
      WorldUtils.getIntersectingTiles(WorldUtils.getGamePos(prevMousePos), WorldUtils.getGamePos(Game.mousePos)).forEach(tilepos => {
        if (World.tileInfo[Editor.selectedTile.id]?.layer) {
          World.setTileAt(tilepos, World.tileInfo[Editor.selectedTile.id]?.layer, Editor.selectedTile.id);
        } else {
          World.setTileAt(tilepos, 0, Editor.selectedTile.id);
        }
      });
    }
    EventBus.emit('editor:autosave');
  }

  // always show correct amount of palette icons
  const fitPaletteIcons = Editor.getFitPaletteIcons();
  // delete extra
  UI.managers.editor.paletteIcons.forEach(element => {
    if (element.index >= fitPaletteIcons) {
      UI.managers.editor.destroy(`PaletteIcon_${element.index}`);
    }
  });
  UI.managers.editor.paletteIcons = UI.managers.editor.paletteIcons.filter(element => element.index < fitPaletteIcons);
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