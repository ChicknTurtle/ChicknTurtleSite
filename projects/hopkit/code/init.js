
import { Game } from "./game.js"
import { Assets } from "./assets.js"
import { Core } from "./core/core.js"
import { Renderer } from "./core/rendering.js"

async function init() {
  Game.canvas = document.getElementById('gameCanvas');
  Game.textInput = document.getElementById('textInput');
  Game.fileInput = document.getElementById('fileInput');
  Game.ctx = Game.canvas.getContext('2d');
  Game.dpr = window.devicePixelRatio || 1;

  await Assets.load();

  Core.init();

  requestAnimationFrame(update);
}

function update(timestamp) {
  requestAnimationFrame(update);
  const frameStart = performance.now();

  const actualDt = (timestamp - Game.lastTimestamp) / 1000;
  Game.dt = Math.min((1/30), actualDt);
  Game.fps = 1 / actualDt;
  Game.lastTimestamp = timestamp;
  Game.gameTime += actualDt;

  if (Game.keybindsClicked['stepFrame'] || !Game.keybinds['frameByFrame']) {
    Core.update(Game.dt);
    if (Game.mousePos) Game.prevMousePos = Game.mousePos.clone();
  }
  Renderer.draw(Game.ctx);

  Game.recentFrameTimes.push(performance.now() - frameStart);
}

init();
