
import { Vec2 } from "../utils/lib.js"
import { Game } from "./../game.js"
import { World } from "./world.js"

export const WorldUtils = {}

WorldUtils.getIntersectingTiles = function(startPoint, endPoint) {
  const tiles = [];
  let currentTile = startPoint.times(1 / World.TILE_SIZE).floor();
  const endTile = endPoint.times(1 / World.TILE_SIZE).floor();
  const delta = endTile.minus(currentTile);
  const step = new Vec2(delta.x < 0 ? -1 : 1, delta.y < 0 ? -1 : 1);
  const dx = Math.abs(delta.x);
  const dy = Math.abs(delta.y);
  let err = dx - dy;
  while (true) {
    tiles.push(currentTile.clone());
    if (currentTile.equals(endTile)) {
      break;
    }
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      currentTile.x += step.x;
    }
    if (e2 < dx) {
      err += dx;
      currentTile.y += step.y;
    }
  }
  return tiles;
}

WorldUtils.getGamePos = function(screenpos) {
  return screenpos.divided(World.cam.zoom).plus(World.cam.pos);
}

WorldUtils.getScreenPos = function(gamepos) {
  return gamepos.minus(World.cam.pos).times(World.cam.zoom);
}

WorldUtils.getGlobalTilePos = function(chunkpos, tilepos) {
  if (chunkpos instanceof World.Chunk) chunkpos = chunkpos.pos;
  return chunkpos.times(World.CHUNK_SIZE).plus(tilepos);
}

WorldUtils.drawGrid = function(ctx, cellSize, color="rgba(255,255,255,0.1)", lineWidth=0.5) {
  let canvas = Game.canvas;
  ctx.beginPath();
  const left = World.cam.pos.x;
  const top = World.cam.pos.y;
  const right = left + canvas.width / Game.dpr / World.cam.zoom;
  const bottom = top + canvas.height / Game.dpr / World.cam.zoom;

  const startX = Math.floor(left / cellSize) * cellSize;
  const endX = Math.ceil(right / cellSize) * cellSize;
  const startY = Math.floor(top / cellSize) * cellSize;
  const endY = Math.ceil(bottom / cellSize) * cellSize;

  for (let x = startX; x <= endX; x += cellSize) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += cellSize) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

WorldUtils.drawHitbox = function(ctx, pos, size, color='rgba(255,255,255,1)') {
  if (!Game.debugToggles?.['drawHitboxes']) { return }
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(pos.x, pos.y, size.x, size.y);
}
