
import { Vec2 } from "./lib.js"
import { Game } from "./game.js"
import { Assets } from "./assets.js"
import { Core } from "./core/core.js"
import { StateManager } from "./core/stateManager.js"
import { World } from "./world/world.js"
import { Renderer } from "./core/rendering.js"

async function init() {
  Game.canvas = document.getElementById('gameCanvas');
  Game.ctx = Game.canvas.getContext('2d');
  Game.dpr = window.devicePixelRatio || 1;

  await Assets.load();

  Core.init();

  requestAnimationFrame(update);
}

function update(timestamp) {
  requestAnimationFrame(update);

  const frameStart = performance.now();

  Game.dt = Math.min(0.1, (timestamp - Game.lastTimestamp) / 1000);
  Game.fps = 1 / Game.dt;
  Game.lastTimestamp = timestamp;
  Game.gameTime += Game.dt;

  Game.recentFps.push(Game.fps);
  if (Game.recentFps.length > 5) Game.recentFps.shift();
  Game.avgFps = Game.recentFps.reduce((a, b) => a + b, 0) / Game.recentFps.length;

  if (Game.recentFrameTimes.length > 30) Game.recentFrameTimes.shift();
  Game.minFrameTime = Math.min(...Game.recentFrameTimes);
  Game.maxFrameTime = Math.max(...Game.recentFrameTimes);
  Game.avgFrameTime = Game.recentFrameTimes.reduce((a, b) => a + b, 0) / Game.recentFrameTimes.length;

  Game.debugText = [];
  Game.debugText.push(`${Math.floor(Game.avgFps)} FPS | ${Math.round(Game.minFrameTime)}-${Math.round(Game.maxFrameTime)}ms, avg ${Math.round(Game.avgFrameTime)}ms`);
  Game.debugText.push(`dpr: ${Game.dpr.toFixed(2)}, canvas: ${Game.canvas.width.toFixed(0)},${Game.canvas.height.toFixed(0)}`);
  Game.debugText.push(`zoom: ${Game.cam.zoom.toFixed(2)}, pos: ${Game.cam.pos.x.toFixed(0)},${Game.cam.pos.y.toFixed(0)}`);
  Game.debugText.push(`inputs: ${Object.keys(Game.inputs)}`);
  Game.debugText.push(`keybinds: ${Object.keys(Game.keybinds)}`);
  Game.debugText.push(`state: ${StateManager.current}`);
  if (World.player) {
    Game.debugText.push(`pos: ${World.player.pos.x.toFixed(0)},${World.player.pos.y.toFixed(0)}, vel: ${World.player.vel.x.toFixed(0)},${World.player.vel.y.toFixed(0)}`);
  }

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

  Core.update(Game.dt);
  Renderer.draw(Game.ctx);

  Game.inputsClicked = {};
  Game.inputsReleased = {};
  Game.keybindsClicked = {};
  Game.keybindsReleased = {};
  if (Game.mousePos) Game.prevMousePos = Game.mousePos.clone();
  Game.recentFrameTimes.push(performance.now() - frameStart);
}

init();
