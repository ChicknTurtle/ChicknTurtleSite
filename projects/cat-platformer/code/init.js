
async function init() {
  // setup scene
  Game.canvas = document.getElementById('gameCanvas');
  Game.ctx = Game.canvas.getContext('2d');
  Game.dpr = window.devicePixelRatio || 1;
  await Assets.load();
  Gameplay.init();
  requestAnimationFrame(update);
}

function update(timestamp) {
  requestAnimationFrame(update);
  // setup frame
  const frameStart = performance.now();
  Game.dt = Math.min(0.1, (timestamp - Game.lastTimestamp)/1000);
  Game.fps = 1/Game.dt;
  Game.recentFps.push(Game.fps);
  if (Game.recentFps.length > 5) {
    Game.recentFps.shift();
  }
  Game.avgFps = Game.recentFps.reduce((total, currentVal) => total + currentVal, 0) / Game.recentFps.length;
  if (Game.recentFrameTimes.length > 30) {
    Game.recentFrameTimes.shift();
  }
  Game.minFrameTime = Math.min(...Game.recentFrameTimes);
  Game.maxFrameTime = Math.max(...Game.recentFrameTimes);
  Game.avgFrameTime = Game.recentFrameTimes.reduce((total, currentVal) => total + currentVal, 0) / Game.recentFrameTimes.length;

  Game.lastTimestamp = timestamp;
  Game.gameTime += Game.dt;
  Game.debugText = [];
  Game.debugText.push(`${Math.floor(Game.avgFps)} FPS | ${Math.round(Game.minFrameTime)}-${Math.round(Game.maxFrameTime)}ms, avg ${Math.round(Game.avgFrameTime)}ms`);
  Game.debugText.push(`dpr: ${Game.dpr.toFixed(2)}, canvas: ${Game.canvas.width.toFixed(0)},${Game.canvas.height.toFixed(0)}`);
  Game.debugText.push(`zoom: ${Game.cam.zoom.toFixed(2)}, pos: ${Game.cam.pos.x.toFixed(0)},${Game.cam.pos.y.toFixed(0)}`);
  Game.debugText.push(`inputs: ${Object.keys(Game.inputs)}`);
  Game.debugText.push(`keybinds: ${Object.keys(Game.keybinds)}`);
  if (World.player) {
    Game.debugText.push(`pos: ${World.player.pos.x.toFixed(0)},${World.player.pos.y.toFixed(0)}, vel: ${World.player.vel.x.toFixed(0)},${World.player.vel.y.toFixed(0)}`)
  }

  Game.dpr = window.devicePixelRatio || 1;
  const rect = Game.canvas.getBoundingClientRect();
  Game.canvas.width = Math.floor(rect.width * Game.dpr);
  Game.canvas.height = Math.floor(rect.height * Game.dpr);

  // loading screen
  if (Game.loading) {
    Game.ctx.save();
    Assets.drawLoadingScreen(Game.ctx, Game.loading);
    Game.ctx.restore();
    return;
  }
  // debug toggles
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

  // update game
  Gameplay.update(Game.dt);
  // draw game
  Renderer.draw(Game.ctx);
  // clean up frame
  Game.inputsClicked = {};
  Game.inputsReleased = {};
  Game.keybindsClicked = {};
  Game.keybindsReleased = {};
  Game.recentFrameTimes.push(performance.now()-frameStart);
}
