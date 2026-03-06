
import { Vec2 } from "../utils/lib.js"
import { Game } from "../game.js"
import { EventBus } from "../core/eventBus.js"
import { World } from "../world/world.js"
import { WorldUtils } from "../world/utils.js"
import { UI } from "../ui/ui.js"
import { EditorElements } from "../ui/editor.js"

export const Editor = {
  SIDEBAR_WIDTH: 70,
  SIDEBAR_HEIGHT: 70,
  PALETTE_WIDTH: 376,
  MAX_AUTOSAVE_TIME: 5,
  selectedTile: null,
  selectedHotbarIndex: 0,
  palette: [
    { type:'tile', id:'wall' },
    { type:'tile', id:'hard_block' },
    { type:'tile', id:'solid_block' },
    { type:'tile', id:'grass' },
    { type:'tile', id:'dirt' },
    { type:'tile', id:'platform' },
    { type:'tile', id:'wall_metal' },
    { type:'tile', id:'wall_metal_pillar' },
    { type:'tile', id:'wall_dirt' },
    { type:'tile', id:'gold' },
    { type:'tile', id:'ruby' },
    { type:'tile', id:'diamond' },
    { type:'tile', id:'emerald' },
    { type:'tile', id:'bush' },
    { type:'tile', id:'spike' },
    { type:'tile', id:'floor_spike' },
    { type:'tile', id:'floor_spike_tall' },
    { type:'tile', id:'floor_spike_small' },
    { type:'entity', id:'player' },
    { type:'entity', id:'coin' },
    { type:'tile', id:'goal_orb' },
  ],
  hotbar: [],
  erasing: false,
  showGrid: true,
  viewingPalette: false,
  hasPopup: false,
  lastAutosave: 0,
  unsavedChanges: false,
}

Editor.moveHotbarIndexToFront = function(idx) {
  if (idx === 0 || idx < 0 || idx >= Editor.hotbar.length) return;
  const entry = Editor.hotbar.splice(idx, 1)[0];
  Editor.hotbar.unshift(entry);
  Editor.selectedHotbarIndex = 0;
  Editor.selectedTile = Editor.hotbar[0];
};

Editor.getFitHotbarIcons = function() {
  return Math.floor(Math.min(Editor.hotbar.length, Math.max(1, ((Game.canvas.width*(1/Game.dpr))-160)/60)));
}

Editor.switchHotbar = function(index) {
  Editor.selectedHotbarIndex = Math.min(index, Editor.getFitHotbarIcons()-1);
}

Editor.zoomCamera = function(amount, pos) {
  const minZoom=0.25, maxZoom=4, snap=4, eps=0.05, base=1.005;
  let z1 = World.cam.zoom * Math.pow(base, -amount);
  if (Math.abs(z1 - snap) < eps) z1 = snap;
  z1 = Math.max(minZoom, Math.min(maxZoom, z1));
  const f = ((1 / z1) - (1 / World.cam.zoom));
  World.cam.pos.subtract(pos.times(f));
  World.cam.zoom = z1;
}

Editor.panCamera = function(delta) {
  World.cam.pos.subtract(delta);
}

Editor.enter = function(payload) {
  UI.managers.editor = new UI.Manager();
  UI.managers.editor.hotbarIcons = [];
  Editor.selectedHotbarIndex = 0;
  Editor.viewingPalette = false;
  if (Editor.hotbar.length === 0) {
    Editor.hotbar = Editor.palette.slice();
  }

  Editor._eb_zoom = (p) => Editor.zoomCamera(p.amount, p.pos);
  Editor._eb_pan = (p) => Editor.panCamera(p.delta);
  Editor._eb_switch_hotbar = (p) => Editor.switchHotbar(p);

  EventBus.on('editor:zoom', Editor._eb_zoom);
  EventBus.on('editor:pan', Editor._eb_pan);
  EventBus.on('editor:switch_hotbar', Editor._eb_switch_hotbar);

  // back button
  UI.managers.editor.show('BackButton', () =>
    new EditorElements.BackButton(() => {
      EventBus.emit('worldio:autosave');
      EventBus.emit('state:request', 'main_menu');
    })
  );
  // palette button
  UI.managers.editor.show('PaletteButton', () =>
    new EditorElements.PaletteButton(() => {
      Editor.viewingPalette = !Editor.viewingPalette;
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
  // palette
  UI.managers.editor.show('PaletteBackground', () =>
    new EditorElements.PaletteBackground()
  );
}

Editor.exit = function() {
  UI.managers.editor.destroyAll();
  delete UI.managers.editor;

  World.cam = { zoom:World.defaultCam.zoom, pos:World.defaultCam.pos.clone(), anchor:World.defaultCam.anchor.clone() };

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
      EventBus.emit('editor:switch_hotbar', i);
    }
  }
  if (Game.inputsClicked['Digit0']) {
    EventBus.emit('editor:switch_hotbar', 9);
  }
  Editor.selectedTile = Editor.hotbar[Editor.selectedHotbarIndex];

  if (!Editor.hasPopup && Game.mousePos && Game.mousePos.y > Editor.SIDEBAR_HEIGHT && Game.mousePos.x < Game.canvas.width*(1/Game.dpr)-(Editor.SIDEBAR_WIDTH+(Editor.viewingPalette ? Editor.PALETTE_WIDTH : 0))) {
    // pan
    if (Game.inputs['Mouse2'] || Game.inputsClicked['Mouse2']) {
      EventBus.emit('editor:pan', { delta: Game.mouseVel.divided(World.cam.zoom) });
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
  const sidebarWidth = (Editor.viewingPalette ? Editor.SIDEBAR_WIDTH + Editor.PALETTE_WIDTH : Editor.SIDEBAR_WIDTH);
  const prevMousePos = Game.prevMousePos ?? Game.mousePos;
  if (Game.mousePos &&
    (!Editor.hasPopup &&
    (Game.inputs['Mouse0'] || Game.inputsClicked['Mouse0']) || (Game.inputs['Mouse1'] || Game.inputsClicked['Mouse1'])) &&
    Game.mousePos.x > 0 &&
    Game.mousePos.x < Game.canvas.width*(1/Game.dpr) - sidebarWidth &&
    Game.mousePos.y > Editor.SIDEBAR_HEIGHT &&
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
        World.setTileAt(tilepos, World.tileInfo[Editor.selectedTile.id]?.layer ?? 0, Editor.selectedTile.id);
        Editor.moveHotbarIndexToFront(Editor.selectedHotbarIndex);
      });
    }
    Editor.unsavedChanges = true;
  }

  // ui

  // always show correct amount of palette icons
  const fitHotbarIcons = Editor.getFitHotbarIcons();
  Editor.selectedHotbarIndex = Math.min(Editor.selectedHotbarIndex, fitHotbarIcons-1);
  // delete extra
  UI.managers.editor.hotbarIcons.forEach(element => {
    if (element.index >= fitHotbarIcons) {
      UI.managers.editor.destroy(`HotbarIcon_${element.index}`);
    }
  });
  UI.managers.editor.hotbarIcons = UI.managers.editor.hotbarIcons.filter(element => element.index < fitHotbarIcons);
  // create needed
  for (let i = 0; i < fitHotbarIcons; i++) {
    if (!UI.managers.editor.get(`HotbarIcon_${i}`)) {
      UI.managers.editor.show(`HotbarIcon_${i}`, () =>
        new EditorElements.HotbarIcon(i)
      );
      UI.managers.editor.hotbarIcons.push(UI.managers.editor.get(`HotbarIcon_${i}`));
    }
  }

  UI.managers.editor && UI.managers.editor.tick && UI.managers.editor.tick();

  // autosave if unsaved changes
  if (Editor.unsavedChanges && Game.gameTime > Editor.lastAutosave + Editor.MAX_AUTOSAVE_TIME) {
    Editor.lastAutosave = Game.gameTime;
    Editor.unsavedChanges = false;
    EventBus.emit('worldio:autosave');
    console.log("Autosaved");
  }
}

Editor.draw = function(ctx) {
  const canvas = Game.canvas;
  // palette bg
  ctx.fillStyle = 'rgba(200,200,200,0.5)';
  ctx.fillRect(0, 0, canvas.width*(1/Game.dpr), Editor.SIDEBAR_HEIGHT);
  // sidebar bg
  ctx.fillStyle = 'rgba(100,100,100,0.5)';
  ctx.fillRect(canvas.width*(1/Game.dpr)-Editor.SIDEBAR_WIDTH, Editor.SIDEBAR_HEIGHT, Editor.SIDEBAR_WIDTH, 3);
  ctx.fillStyle = 'rgba(200,200,200,0.5)';
  ctx.fillRect(canvas.width*(1/Game.dpr)-Editor.SIDEBAR_WIDTH, Editor.SIDEBAR_HEIGHT+3, Editor.SIDEBAR_WIDTH, canvas.height*(1/Game.dpr)-Editor.SIDEBAR_HEIGHT-3);
  // ui
  UI.managers.editor.draw(ctx);
}
