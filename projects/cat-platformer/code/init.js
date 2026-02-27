
import { Game } from "./game.js"
import { Assets } from "./assets.js"
import { Core } from "./core/core.js"
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
