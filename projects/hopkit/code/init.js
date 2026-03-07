
import { Game } from "./game.js"
import { Assets } from "./assets.js"
import { Core } from "./core/core.js"
import { Renderer } from "./core/rendering.js"

async function init() {
  if (Game.isDev) {
    console.log("Running in dev mode");
    nw.Window.get().showDevTools();
    Game.debugToggles['debugText'] = true;
  }

  Game.canvas = document.getElementById('gameCanvas');
  Game.textInput = document.getElementById('textInput');
  Game.fileInput = document.getElementById('fileInput');
  Game.ctx = Game.canvas.getContext('2d');
  Game.dpr = window.devicePixelRatio || 1;

  await Assets.load();

  Core.init();

  requestAnimationFrame(update);
}

function update() {
  requestAnimationFrame(update);
  const frameStart = performance.now();

  const now = performance.now();
  let dt = (now - Game.lastTimestamp) / 1000;
  Game.lastTimestamp = now;
  if (dt <= 0) return;
  Game.dt = Math.min(dt, 1/30);
  Game.fps = 1 / dt;
  Game.gameTime += dt;

  if (Game.keybindsClicked['stepFrame'] || !Game.keybinds['frameByFrame']) {
    Core.update(Game.dt);
    if (Game.mousePos) Game.prevMousePos = Game.mousePos.clone();
  }
  Renderer.draw(Game.ctx);

  Game.recentFrameTimes.push(performance.now() - frameStart);
}

init();
