
const World = {
  TILE_SIZE: 16,
  CHUNK_SIZE: 16,
  tileInfo: {
    "default": { pos:new Vec2(0,0), solid:true },
    "wall": { pos:new Vec2(1,0), solid:true },
  },
  chunks: {},
  layers: {
    'BACKGROUND': 0,
    'GROUND': 1,
    'FOREGROUND': 2,
  },
  player: null,
  entities: [],
}

World.tilePosFrom = function(pos) {
  return pos.divided(World.TILE_SIZE).floor()
}

World.getTileAt = function(pos, layer=0) {
  const chunk = World.getChunkAt(pos);
  if (!chunk) return;
  const localPos = pos.emodded(World.CHUNK_SIZE);
  return chunk.getTile(localPos, layer);
}

World.getTiledataAt = function(pos, layer=0) {
  const chunk = World.getChunkAt(pos);
  if (!chunk) return;
  const localPos = pos.emodded(World.CHUNK_SIZE);
  return chunk.getTiledata(localPos, layer);
}

World.getChunk = function(chunkpos) {
  return World.chunks[`${chunkpos.x},${chunkpos.y}`];
}

World.getChunkAt = function(pos) {
  return World.getChunk(pos.divided(World.CHUNK_SIZE).floor());
}

World.setTileAt = function(pos, layer, tile, tiledata={}) {
  // create chunk if it doesn't exist
  const chunkPos = pos.divided(World.CHUNK_SIZE).floor();
  let chunk = World.getChunk(chunkPos);
  if (!chunk) {
    if (tile === null) return;
    chunk = new World.Chunk(chunkPos);
    World.chunks[`${chunkPos.x},${chunkPos.y}`] = chunk;
  };
  // set tile within the chunk
  const localPos = pos.emodded(World.CHUNK_SIZE);
  chunk.setTile(localPos, layer, tile, tiledata);
}

World.Chunk = class {
  constructor(pos) {
    this.pos = pos;
    this.layers = {};
    // create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = World.CHUNK_SIZE * World.TILE_SIZE;
    this.canvas.height = World.CHUNK_SIZE * World.TILE_SIZE;
    this.ctx = this.canvas.getContext('2d');
    this.rerender = true;
  }
  initLayer(layer) {
    this.layers[layer] = {tiles:[],tileCount:0,tiledata:{}};
    const row = [];
    for (let i = 0; i < World.CHUNK_SIZE; i++) {
      row.push(null);
    }
    for (let i = 0; i < World.CHUNK_SIZE; i++) {
      this.layers[layer].tiles.push([...row]);
    }
    return this.layers[layer];
  }
  getTile(localpos, layer) {
    localpos = localpos.floored();
    return this.layers?.[layer]?.tiles[localpos.y]?.[localpos.x] ?? null;
  }
  getTiledata(localpos, layer) {
    localpos = localpos.floored();
    return this.layers?.[layer]?.tiledata[`${localpos.x},${localpos.y}`] ?? {};
  }
  setTile(localpos, layer, tile, tiledata={}) {
    localpos = localpos.floored();
    const layerObj = this.layers[layer] ?? this.initLayer(layer);
    const currentTile = this.getTile(localpos, layer);
    // update tile count
    if (currentTile === null && tile !== null) {
      layerObj.tileCount++;
    } else if (currentTile !== null && tile === null) {
        layerObj.tileCount--;
    }
    // delete layer/chunk when empty
    if (layerObj.tileCount <= 0) {
      delete this.layers[layer];
      if (Object.keys(this.layers).length === 0) {
        delete World.chunks[`${this.pos.x},${this.pos.y}`]
      }
      return;
    }
    // set tile and tiledata
    layerObj.tiles[localpos.y][localpos.x] = tile;
    if (Object.keys(tiledata).length !== 0) {
      layerObj.tiledata[`${localpos.x},${localpos.y}`] = tiledata;
    } else {
      delete layerObj.tiledata[`${localpos.x},${localpos.y}`];
    }
    this.rerender = true;
  }
  onScreen() {
    const chunkWorldPos = this.pos.times(World.CHUNK_SIZE * World.TILE_SIZE);
    const chunkWorldWidth = World.CHUNK_SIZE * World.TILE_SIZE;
    const chunkWorldHeight = World.CHUNK_SIZE * World.TILE_SIZE;
    const camWorldWidth = Game.canvas.width / Game.dpr / Game.cam.zoom;
    const camWorldHeight = Game.canvas.height / Game.dpr / Game.cam.zoom;
    return !(
      chunkWorldPos.x > Game.cam.pos.x + camWorldWidth ||
      chunkWorldPos.x + chunkWorldWidth < Game.cam.pos.x ||
      chunkWorldPos.y > Game.cam.pos.y + camWorldHeight ||
      chunkWorldPos.y + chunkWorldHeight < Game.cam.pos.y
    );
  }
  render(ctx) {
    if (this.rerender) {
      this.rerender = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const tileset = Game.textures['tiles'];
      Object.keys(this.layers).forEach(layer => {
        for (let y = 0; y < World.CHUNK_SIZE; y++) {
          for (let x = 0; x < World.CHUNK_SIZE; x++) {
            const pos = new Vec2(x,y);
            const tile = this.getTile(pos, layer);
            if (!tile) continue; // empty tile
            const tileChunkPos = new Vec2(x,y);
            const tileInfo = World.tileInfo[tile];
            let drawPos = tileInfo?.pos ?? new Vec2(0,0);
            // draw to chunk canvas
            const tileSpritesheetPos = drawPos.times(World.TILE_SIZE);
            const tileDrawPos = tileChunkPos.times(World.TILE_SIZE).floor();
            this.ctx.drawImage(tileset, tileSpritesheetPos.x, tileSpritesheetPos.y, World.TILE_SIZE, World.TILE_SIZE, tileDrawPos.x, tileDrawPos.y, World.TILE_SIZE, World.TILE_SIZE);
          }
        }
      });
    }
    const chunkDrawPos = this.pos.times(World.CHUNK_SIZE * World.TILE_SIZE);
    ctx.drawImage(this.canvas, chunkDrawPos.x, chunkDrawPos.y);
  }
}

World.draw = function(ctx) {
  // chunks
  Object.values(World.chunks).forEach(chunk => {
    if (!chunk.onScreen()) return;
    chunk.render(ctx);
  });
  // player
  World.player.draw(ctx);
  // chunk grid
  if (Game.debugToggles['chunkGrid']) {
    World.drawGrid(ctx, World.CHUNK_SIZE*World.TILE_SIZE, "rgba(255,0,0,0.5)", 2);
  }
}
