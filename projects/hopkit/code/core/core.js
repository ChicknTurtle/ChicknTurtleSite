
import { Vec2 } from "./../utils/lib.js"
import { Game } from "./../game.js"
import { InputManager } from "./../inputs.js"
import { EventBus } from "./../core/eventBus.js"
import { World } from "./../world/world.js"
import { WorldIO } from "./../world/io.js"
import { Entities } from "../entities/entities.js"
import { StateManager } from "./../core/stateManager.js"
import { Editor } from "../states/editor.js"
import { MainMenuState } from "../states/mainMenu.js"
import { GameplayState } from "../states/gameplay.js"
import { EditorGameplayState } from "../states/editor_gameplay.js"

export const Core = {}

Core.init = function() {
  // wire events
  EventBus.on('state:request', (name) => {
    StateManager.change(name);
  });
  EventBus.on('worldio:save_to_file', WorldIO.saveToFile);
  EventBus.on('worldio:load_from_file', WorldIO.loadFromFile);
  EventBus.on('worldio:autosave', WorldIO.autosave);
  EventBus.on('worldio:load_autosave', WorldIO.loadAutosave);

  // register states
  StateManager.register('main_menu', MainMenuState);
  StateManager.register('gameplay', GameplayState);
  StateManager.register('editor', Editor);
  StateManager.register('editor_gameplay', EditorGameplayState);

  // load autosave
  EventBus.emit('worldio:load_autosave');

  // setup keybinds
  InputManager.addKeybind('moveLeft', ['KeyA','ArrowLeft'])
  InputManager.addKeybind('moveRight', ['KeyD','ArrowRight'])
  InputManager.addKeybind('jump', ['KeyW','ArrowUp'])
  InputManager.addKeybind('crouch', ['KeyS','ArrowDown'])
  InputManager.addKeybind('attack', ['KeyX','KeyK'])
  InputManager.addKeybind('editorCamLeft', ['KeyA','ArrowLeft'])
  InputManager.addKeybind('editorCamRight', ['KeyD','ArrowRight'])
  InputManager.addKeybind('editorCamUp', ['KeyW','ArrowUp'])
  InputManager.addKeybind('editorCamDown', ['KeyS','ArrowDown'])
  InputManager.addKeybind('editorZoomIn', ['Equal'])
  InputManager.addKeybind('editorZoomOut', ['Minus'])
  InputManager.addKeybind('editorToggleGrid', ['KeyG'])

  // register entities
  Entities.register();

  // initial state
  StateManager.change('main_menu');
}

Core.update = function(dt) {
  // recent fps/frame times
  Game.recentFps.push(Game.fps);
  if (Game.recentFps.length > 5) Game.recentFps.shift();
  Game.avgFps = Game.recentFps.reduce((a, b) => a + b, 0) / Game.recentFps.length;

  if (Game.recentFrameTimes.length > 30) Game.recentFrameTimes.shift();
  Game.minFrameTime = Math.min(...Game.recentFrameTimes);
  Game.maxFrameTime = Math.max(...Game.recentFrameTimes);
  Game.avgFrameTime = Game.recentFrameTimes.reduce((a, b) => a + b, 0) / Game.recentFrameTimes.length;

  // debug text
  Game.debugText = [];
  Game.debugText.push(`${Math.floor(Game.avgFps)} FPS | ${Math.round(Game.minFrameTime)}-${Math.round(Game.maxFrameTime)}ms, avg ${Math.round(Game.avgFrameTime)}ms`);
  Game.debugText.push(`dpr: ${Game.dpr.toFixed(2)}, canvas: ${Game.canvas.width.toFixed(0)},${Game.canvas.height.toFixed(0)}`);
  Game.debugText.push(`state: ${StateManager.current}`);
  Game.debugText.push(`cam: ${World.cam.pos.x.toFixed(0)},${World.cam.pos.y.toFixed(0)}, zoom: ${World.cam.zoom.toFixed(2)}`);
  Game.debugText.push(`inputs: ${Object.keys(Game.inputs)}`);
  Game.debugText.push(`keybinds: ${Object.keys(Game.keybinds)}`);

  Game.dpr = window.devicePixelRatio || 1;
  const rect = Game.canvas.getBoundingClientRect();
  Game.canvas.width = Math.floor(rect.width * Game.dpr);
  Game.canvas.height = Math.floor(rect.height * Game.dpr);

  if (Game.mousePos && Game.prevMousePos) {
    Game.mouseVel = Game.mousePos.minus(Game.prevMousePos);
  } else {
    Game.mouseVel = new Vec2(0);
  }

  if (Game.loading) {
    Game.ctx.save();
    Assets.drawLoadingScreen(Game.ctx, Game.loading);
    Game.ctx.restore();
    return;
  }

  if (Game.inputsReleased['Backslash']) {
    if (!Game.ignoreNextDebugToggle) {
      Game.debugToggles['debugText'] = !Game.debugToggles['debugText'];
    }
    Game.ignoreNextDebugToggle = false;
  } else if (Game.inputs['Backslash']) {
    if (Game.inputsClicked['KeyG']) {
      Game.ignoreNextDebugToggle = true;
      Game.debugToggles['chunkGrid'] = !Game.debugToggles['chunkGrid'];
    }
    if (Game.inputsClicked['KeyH']) {
      Game.ignoreNextDebugToggle = true;
      Game.debugToggles['drawHitboxes'] = !Game.debugToggles['drawHitboxes'];
    }
  }

  Game.setCursor('default');
  
  StateManager.update(Game.dt);
}
