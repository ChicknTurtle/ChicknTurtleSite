
import { Vec2 } from "./../lib.js"
import { Game } from "./../game.js"

export const World = {
  TILE_SIZE: 16,
  CHUNK_SIZE: 32,
  tileInfo: {
    "error": { pos:new Vec2(0,0), solid:true, layer:1, hidden:true },
    "wall": { pos:new Vec2(1,0), solid:true, layer:1 },
    "grass": { pos:new Vec2(2,0), solid:true, layer:1 },
    "dirt": { pos:new Vec2(3,0), solid:true, layer:1 },
    "gold": { pos:new Vec2(4,0), solid:true, layer:1 },
    "ruby": { pos:new Vec2(5,0), solid:true, layer:1 },
    "diamond": { pos:new Vec2(6,0), solid:true, layer:1 },
    "emerald": { pos:new Vec2(7,0), solid:true, layer:1 },
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
  }

  initLayer(layer) {
    const layerObj = {
      tiles: [],
      tileCount: 0,
      tiledata: {},
      rerender: true,
      canvas: document.createElement('canvas'),
      ctx: null,
    };

    const chunkPx = World.CHUNK_SIZE * World.TILE_SIZE;
    layerObj.canvas.width = chunkPx;
    layerObj.canvas.height = chunkPx;
    layerObj.ctx = layerObj.canvas.getContext('2d');

    const row = new Array(World.CHUNK_SIZE).fill(null);
    for (let i = 0; i < World.CHUNK_SIZE; i++) {
      layerObj.tiles.push([...row]);
    }

    this.layers[layer] = layerObj;
    return layerObj;
  }

  getTile(localpos, layer) {
    localpos = localpos.floored();
    return this.layers?.[layer]?.tiles[localpos.y]?.[localpos.x] ?? null;
  }

  getTiledata(localpos, layer) {
    localpos = localpos.floored();
    return this.layers?.[layer]?.tiledata[`${localpos.x},${localpos.y}`] ?? {};
  }

  setTile(localpos, layer, tile, tiledata = {}) {
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
      if (layerObj.canvas) {
        layerObj.ctx = null;
        layerObj.canvas.width = 0;
        layerObj.canvas.height = 0;
        layerObj.canvas = null;
      }
      delete this.layers[layer];
      if (Object.keys(this.layers).length === 0) {
        delete World.chunks[`${this.pos.x},${this.pos.y}`];
      }
      return;
    }

    // set tile
    layerObj.tiles[localpos.y][localpos.x] = tile;
    if (Object.keys(tiledata).length !== 0) {
      layerObj.tiledata[`${localpos.x},${localpos.y}`] = tiledata;
    } else {
      delete layerObj.tiledata[`${localpos.x},${localpos.y}`];
    }

    layerObj.rerender = true;
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

  _clearLayerRerender(layer) {
    if (this.layers?.[layer]) this.layers[layer].rerender = false;
  }
}
