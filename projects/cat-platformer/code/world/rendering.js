
import { Vec2 } from "./../lib.js"
import { Game } from "./../game.js"
import { StateManager } from "./../core/stateManager.js"
import { Editor } from "./../editor.js"
import { World } from "./world.js"
import { WorldUtils } from "./utils.js"

export const WorldRenderer = {}

WorldRenderer.draw = function(ctx) {
  // chunks
  Object.values(World.chunks).forEach(chunk => {
    if (!chunk.onScreen()) return;
    chunk.render(ctx);
  });
  // player
  if (World.player) {
    World.player.draw(ctx);
  }

  // draw editor
  if (StateManager.current === 'editor') {
    WorldUtils.drawGrid(ctx, World.TILE_SIZE, "rgba(255,255,255,0.1)", 0.5);

    // tile highlight
    if (Game.mousePos &&
      Game.mousePos.x > 0 &&
      Game.mousePos.x < Game.canvas.width*(1/Game.dpr) - Editor.SIDEBAR_WIDTH &&
      Game.mousePos.y > Editor.PALETTE_HEIGHT &&
      Game.mousePos.y < Game.canvas.height*(1/Game.dpr)
    ) {
      const mouseTilePos = WorldUtils.getGamePos(Game.mousePos).divided(World.TILE_SIZE).floor();
      const mouseTileScreenPos = mouseTilePos.times(World.TILE_SIZE);
      let tile = World.getTileAt(mouseTilePos, World.layers.ROOF) ?? World.getTileAt(mouseTilePos, World.layers.OBJECTS) ?? World.getTileAt(mouseTilePos, World.layers.DECORATIONS) ?? World.getTileAt(mouseTilePos, 0);
      if (
        (Editor.selectedTile !== tile) &&
        !Editor.erasing
      ) {
        const tileSpritesheetPos = World.tileInfo[Editor.selectedTile]?.pos?.times(World.TILE_SIZE) ?? new Vec2(0,0);
        if (World.tileInfo[Editor.selectedTile]?.useAutoTile) {
          tileSpritesheetPos.add(new Vec2(World.TILE_SIZE*3, World.TILE_SIZE*3));
        }
        ctx.globalAlpha = 0.5;
        ctx.drawImage(Game.textures['tiles'], tileSpritesheetPos.x, tileSpritesheetPos.y, World.TILE_SIZE, World.TILE_SIZE, mouseTileScreenPos.x, mouseTileScreenPos.y, World.TILE_SIZE, World.TILE_SIZE);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(mouseTileScreenPos.x, mouseTileScreenPos.y, World.TILE_SIZE, World.TILE_SIZE)
      }

      Game.debugText.push(`tile: ${Math.floor(mouseTilePos.x)},${Math.floor(mouseTilePos.y)}`);
      Object.keys(World.layers).forEach(layerName => {
        const tile = World.getTileAt(mouseTilePos, World.layers[layerName]);
        const tiledata = World.getTiledataAt(mouseTilePos, World.layers[layerName]) ?? {};
        Game.debugText.push(` ${layerName}: ${tile} ${JSON.stringify(tiledata)}`);
      });
    }
  }

  // chunk grid
  if (Game.debugToggles['chunkGrid']) {
    WorldUtils.drawGrid(ctx, World.CHUNK_SIZE*World.TILE_SIZE, "rgba(255,0,0,0.5)", 2);
  }
}
