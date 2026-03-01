
import { Vec2 } from "./../lib.js"
import { Game } from "./../game.js"

export const World = {
  TILE_SIZE: 16,
  CHUNK_SIZE: 32,
  BUCKET_SIZE_TILES: 4,
  tileInfo: {
    "error": { pos:new Vec2(0,0), layer:1, solid:true },
    "wall": { pos:new Vec2(1,0), layer:1, solid:true },
    "grass": { pos:new Vec2(2,0), layer:1, solid:true },
    "dirt": { pos:new Vec2(3,0), layer:1, solid:true },
    "platform": { pos:new Vec2(0,1), layer:1, semisolid:true },
    "wall_metal": { pos:new Vec2(1,1), layer:0 },
    "wall_dirt": { pos:new Vec2(2,1), layer:0 },
    "gold": { pos:new Vec2(4,0), layer:1, solid:true },
    "ruby": { pos:new Vec2(5,0), layer:1, solid:true },
    "diamond": { pos:new Vec2(6,0), layer:1, solid:true },
    "emerald": { pos:new Vec2(7,0), layer:1, solid:true },
    "bush": { pos:new Vec2(0,2), layer:1 },
    "player": { entity:'player', layer:2 },
    "coin": { entity:'coin', layer:2 },
  },
  chunks: {},
  layers: {
    'BACKGROUND': 0,
    'GROUND': 1,
    'ENTITY': 2,
  },
  entities: [],
  chunkEntities: {},
  entityBuckets: {},
  spawnPos: null,
}

// Entity management

World._tileKey = (tx, ty) => `${tx},${ty}`;
World._bucketKey = (bx, by) => `${bx},${by}`;
World._chunkKey = (cx, cy) => `${cx},${cy}`;

World._tilesCovered = function(worldPos, size) {
  const ts = World.TILE_SIZE;
  const minTx = Math.floor(worldPos.x / ts);
  const minTy = Math.floor(worldPos.y / ts);
  const maxTx = Math.floor((worldPos.x + size.x - 1e-9) / ts);
  const maxTy = Math.floor((worldPos.y + size.y - 1e-9) / ts);

  const out = [];
  for (let y = minTy; y <= maxTy; y++) {
    for (let x = minTx; x <= maxTx; x++) out.push({ x, y });
  }
  return out;
};

World._chunkFromWorld = function(worldPos) {
  const chunkPx = World.CHUNK_SIZE * World.TILE_SIZE;
  return {
    x: Math.floor(worldPos.x / chunkPx),
    y: Math.floor(worldPos.y / chunkPx),
  };
};

World._bucketFromTile = function(tileX, tileY) {
  const b = World.BUCKET_SIZE_TILES;
  return {
    x: Math.floor(tileX / b),
    y: Math.floor(tileY / b),
  };
};

World._addToBucket = function(entity, bucketKey) {
  let s = World.entityBuckets[bucketKey];
  if (!s) { s = new Set(); World.entityBuckets[bucketKey] = s; }
  s.add(entity);
};
World._removeFromBucket = function(entity, bucketKey) {
  const s = World.entityBuckets[bucketKey];
  if (!s) return;
  s.delete(entity);
  if (s.size === 0) delete World.entityBuckets[bucketKey];
};

World._insertIntoBuckets = function(entity) {
  const tiles = World._tilesCovered(entity.pos, entity.size);
  const keys = [];
  for (const t of tiles) {
    const b = World._bucketFromTile(t.x, t.y);
    const bk = World._bucketKey(b.x, b.y);
    if (!keys.includes(bk)) {
      keys.push(bk);
      World._addToBucket(entity, bk);
    }
  }
  entity._bucketKeys = keys;
};

World._removeFromBuckets = function(entity) {
  if (!entity._bucketKeys || entity._bucketKeys.length === 0) return;
  for (const bk of entity._bucketKeys) World._removeFromBucket(entity, bk);
  entity._bucketKeys = null;
};

World._addToChunk = function(entity, chunkKey) {
  let s = World.chunkEntities[chunkKey];
  if (!s) { s = new Set(); World.chunkEntities[chunkKey] = s; }
  s.add(entity);
  entity._chunkKey = chunkKey;
};
World._removeFromChunk = function(entity) {
  const k = entity._chunkKey;
  if (!k) return;
  const s = World.chunkEntities[k];
  if (s) {
    s.delete(entity);
    if (s.size === 0) delete World.chunkEntities[k];
  }
  entity._chunkKey = null;
};

World._chunkKeyFromWorld = function(worldPos) {
  const c = World._chunkFromWorld(worldPos);
  return World._chunkKey(c.x, c.y);
};

World._sameKeySets = function(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const s = new Set(a);
  for (const v of b) if (!s.has(v)) return false;
  return true;
};

// add entity
World.addEntity = function(entity) {
  World.entities.push(entity);
  if (!entity.pos || !entity.size) throw new Error('entity must have pos and size');
  World._insertIntoBuckets(entity);
  const chunkKey = World._chunkKeyFromWorld(entity.pos);
  World._addToChunk(entity, chunkKey);
};

// remove entity
World.removeEntity = function(entity) {
  const i = World.entities.indexOf(entity);
  if (i !== -1) {
    const last = World.entities.pop();
    if (last !== entity) World.entities[i] = last;
  }

  World._removeFromBuckets(entity);
  World._removeFromChunk(entity);
};

// update entity pos
World.updateEntityPosition = function(entity, newWorldPos) {
  const tiles = World._tilesCovered(newWorldPos, entity.size);
  const newBucketSet = [];
  for (const t of tiles) {
    const b = World._bucketFromTile(t.x, t.y);
    const bk = World._bucketKey(b.x, b.y);
    if (!newBucketSet.includes(bk)) newBucketSet.push(bk);
  }

  if (!World._sameKeySets(entity._bucketKeys, newBucketSet)) {
    World._removeFromBuckets(entity);
    if (entity.pos && typeof entity.pos.x === 'number') {
      entity.pos.x = newWorldPos.x;
      entity.pos.y = newWorldPos.y;
    } else {
      entity.pos = newWorldPos;
    }
    entity._bucketKeys = [];
    for (const bk of newBucketSet) {
      World._addToBucket(entity, bk);
      entity._bucketKeys.push(bk);
    }
  } else {
    if (entity.pos && typeof entity.pos.x === 'number') {
      entity.pos.x = newWorldPos.x;
      entity.pos.y = newWorldPos.y;
    } else {
      entity.pos = newWorldPos;
    }
  }

  const newChunkKey = World._chunkKeyFromWorld(newWorldPos);
  if (entity._chunkKey !== newChunkKey) {
    World._removeFromChunk(entity);
    World._addToChunk(entity, newChunkKey);
  }
};

// efficiently get entities in bounding box
World.queryEntitiesInAABB = function(worldPos, size) {
  const tiles = World._tilesCovered(worldPos, size);
  const found = new Set();
  for (const t of tiles) {
    const b = World._bucketFromTile(t.x, t.y);
    const bk = World._bucketKey(b.x, b.y);
    const s = World.entityBuckets[bk];
    if (!s) continue;
    for (const ent of s) found.add(ent);
  }
  const out = [];
  for (const ent of found) {
    if (!ent.pos || !ent.size) continue;
    if (!(
      worldPos.x + size.x <= ent.pos.x ||
      ent.pos.x + ent.size.x <= worldPos.x ||
      worldPos.y + size.y <= ent.pos.y ||
      ent.pos.y + ent.size.y <= worldPos.y
    )) out.push(ent);
  }
  return out;
};

// Tile management

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
