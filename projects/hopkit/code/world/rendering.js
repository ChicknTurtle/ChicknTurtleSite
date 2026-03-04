
import { Vec2 } from "./../utils/lib.js"
import { Game } from "./../game.js"
import { StateManager } from "./../core/stateManager.js"
import { Editor } from "./../states/editor.js"
import { World } from "./world.js"
import { WorldUtils } from "./utils.js"

export const WorldRenderer = {
  layerAlpha: {},
}

WorldRenderer._bakeChunkLayer = function(chunk, layer) {
  const layerObj = chunk.layers?.[layer];
  if (!layerObj) return;

  if (!layerObj.canvas) {
    const chunkPx = World.CHUNK_SIZE * World.TILE_SIZE;
    layerObj.canvas = document.createElement('canvas');
    layerObj.canvas.width = chunkPx;
    layerObj.canvas.height = chunkPx;
    layerObj.ctx = layerObj.canvas.getContext('2d');
    layerObj.rerender = true;
  }
  if (!layerObj.rerender) return;

  const lctx = layerObj.ctx;
  lctx.clearRect(0, 0, layerObj.canvas.width, layerObj.canvas.height);

  const tileset = Game.textures['tiles'];
  for (let y = 0; y < World.CHUNK_SIZE; y++) {
    for (let x = 0; x < World.CHUNK_SIZE; x++) {
      const tile = layerObj.tiles?.[y]?.[x];
      if (!tile) continue;
      const tileInfo = World.tileInfo[tile];
      if (!tileInfo) continue;
      if (tileInfo.entity) {
        const entityInfo = Game.entities?.[tileInfo.entity];
        if (!entityInfo) continue;
        const icon = entityInfo.icon;
        if (icon) {
          lctx.drawImage(Game.textures[icon.texture], icon.pos.x, icon.pos.y, icon.size.x, icon.size.y, x*World.TILE_SIZE, y*World.TILE_SIZE, World.TILE_SIZE, World.TILE_SIZE);
        }
      } else {
        const tileSpritesheetPos = (tileInfo.pos ?? new Vec2(0,0)).times(World.TILE_SIZE);
        const tileDrawPos = new Vec2(x, y).times(World.TILE_SIZE).floor();
        lctx.drawImage(
          tileset,
          tileSpritesheetPos.x, tileSpritesheetPos.y,
          World.TILE_SIZE, World.TILE_SIZE,
          tileDrawPos.x, tileDrawPos.y,
          World.TILE_SIZE, World.TILE_SIZE
        );
      }
    }
  }

  layerObj.rerender = false;
}

WorldRenderer.draw = function(ctx) {
  const camWorldWidth = Game.canvas.width / Game.dpr / World.cam.zoom;
  const camWorldHeight = Game.canvas.height / Game.dpr / World.cam.zoom;
  const camWorldPos = World.cam.pos;
  const camRect = { x: camWorldPos.x, y: camWorldPos.y, w: camWorldWidth, h: camWorldHeight };

  let layerKeys = [];
  try {
    layerKeys = Object.values(World.layers).slice().sort((a,b) => a - b);
  } catch (e) {
    const set = new Set();
    Object.values(World.chunks).forEach(c => Object.keys(c.layers || {}).forEach(k => set.add(Number(k))));
    layerKeys = Array.from(set).sort((a,b)=>a-b);
  }

  const visibleChunks = Object.values(World.chunks).filter(chunk => chunk.onScreen());
  const chunkSizePx = World.CHUNK_SIZE * World.TILE_SIZE;

  // draw chunks
  layerKeys.forEach(layer => {
    const alpha = this.layerAlpha[layer] ?? 1;

    for (let i = 0; i < visibleChunks.length; i++) {
      const chunk = visibleChunks[i];
      const layerObj = chunk.layers?.[layer];
      if (!layerObj) continue;

      if (layerObj.rerender) {
        this._bakeChunkLayer(chunk, layer);
      }

      if (!layerObj.canvas) continue;

      const chunkDrawPos = chunk.pos.times(chunkSizePx);

      if (
        chunkDrawPos.x + chunkSizePx < camRect.x ||
        chunkDrawPos.x > camRect.x + camRect.w ||
        chunkDrawPos.y + chunkSizePx < camRect.y ||
        chunkDrawPos.y > camRect.y + camRect.h
      ) continue;

      ctx.globalAlpha = alpha;
      ctx.drawImage(layerObj.canvas, chunkDrawPos.x, chunkDrawPos.y);
      ctx.globalAlpha = 1;
    }
  });

  // entities
  World.entities.forEach(entity => {
    entity.draw(ctx);
  });

  // editor overlays
  if (StateManager.current === 'editor') {
    // grid
    if (Editor.showGrid) {
      WorldUtils.drawGrid(ctx, World.TILE_SIZE, "rgba(255,255,255,0.1)", 0.5);
    }

    // tile hover
    const sidebarWidth = (Editor.viewingPalette ? Editor.SIDEBAR_WIDTH + Editor.PALETTE_WIDTH : Editor.SIDEBAR_WIDTH);
    if (Game.mousePos &&
      Game.mousePos.x > 0 &&
      Game.mousePos.x < Game.canvas.width*(1/Game.dpr) - sidebarWidth &&
      Game.mousePos.y > Editor.SIDEBAR_HEIGHT &&
      Game.mousePos.y < Game.canvas.height*(1/Game.dpr)
    ) {
      const mouseTilePos = WorldUtils.getGamePos(Game.mousePos).divided(World.TILE_SIZE).floor();
      const mouseTileScreenPos = mouseTilePos.times(World.TILE_SIZE);
      let tile = World.getTileAt(mouseTilePos, World.layers.ROOF) ?? World.getTileAt(mouseTilePos, World.layers.OBJECTS) ?? World.getTileAt(mouseTilePos, World.layers.DECORATIONS) ?? World.getTileAt(mouseTilePos, 0);
      if (
        (Editor.selectedTile?.id !== tile) &&
        !Editor.erasing
      ) {
        if (Editor.selectedTile.type === 'tile') {
          const tileSpritesheetPos = World.tileInfo[Editor.selectedTile.id]?.pos?.times(World.TILE_SIZE) ?? new Vec2(0,0);
          ctx.globalAlpha = 0.5;
          ctx.drawImage(Game.textures['tiles'], tileSpritesheetPos.x, tileSpritesheetPos.y, World.TILE_SIZE, World.TILE_SIZE, mouseTileScreenPos.x, mouseTileScreenPos.y, World.TILE_SIZE, World.TILE_SIZE);
          ctx.globalAlpha = 1;
        } else if (Editor.selectedTile.type === 'entity') {
          const icon = Game.entities[Editor.selectedTile.id]?.icon;
          if (icon) {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(Game.textures[icon.texture], icon.pos.x, icon.pos.y, icon.size.x, icon.size.y, mouseTileScreenPos.x, mouseTileScreenPos.y, World.TILE_SIZE, World.TILE_SIZE);
            ctx.globalAlpha = 1;
          }
        }
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

  // chunk grid debug
  if (Game.debugToggles['chunkGrid']) {
    WorldUtils.drawGrid(ctx, World.CHUNK_SIZE*World.TILE_SIZE, "rgba(255,0,0,0.5)", 2);
  }
}