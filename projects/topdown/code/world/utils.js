
World.getIntersectingTiles = function(startPoint, endPoint) {
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

World.getGamePos = function(screenpos) {
  return screenpos.divided(Game.cam.zoom).plus(Game.cam.pos);
}

World.getScreenPos = function(gamepos) {
  return gamepos.minus(Game.cam.pos).times(Game.cam.zoom);
}

World.getGlobalTilePos = function(chunkpos, tilepos) {
  if (chunkpos instanceof World.Chunk) chunkpos = chunkpos.pos;
  return chunkpos.times(World.CHUNK_SIZE).plus(tilepos);
}

World.drawGrid = function(ctx, cellSize, color="rgba(255,255,255,0.1)", lineWidth=0.5) {
  let canvas = Game.canvas;
  ctx.beginPath();
  const left = Game.cam.pos.x;
  const top = Game.cam.pos.y;
  const right = left + canvas.width / Game.dpr / Game.cam.zoom;
  const bottom = top + canvas.height / Game.dpr / Game.cam.zoom;

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

World.drawHitbox = function(ctx, pos, size, color='rgba(255,255,255,1)') {
  if (!Game.debugToggles?.['showHitboxes']) { return }
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(pos.x, pos.y, size.x, size.y);
}
