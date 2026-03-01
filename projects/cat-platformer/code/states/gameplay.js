
import { Vec2 } from "../lib.js"
import { Game } from "../game.js"
import { EventBus } from "../core/eventBus.js"
import { World } from "../world/world.js"
import { UI } from "../ui/ui.js"
import { EditorElements } from "../ui/editor.js"

export const GameplayState = {}

GameplayState.readyGameplay = function() {
  // reset world state
  World.entities = [];
  World.chunkEntities = {};
  World.entityBuckets = {};
  World.spawnPos = new Vec2(0,0);
  // spawn entities
  const layer = World.layers.ENTITY;
  for (const chunkKey in World.chunks) {
    const chunk = World.chunks[chunkKey];
    if (!chunk) continue;
    for (let ly = 0; ly < World.CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < World.CHUNK_SIZE; lx++) {
        const local = new Vec2(lx, ly);
        const tileId = chunk.getTile(local, layer);
        if (!tileId) continue;
        const info = World.tileInfo[tileId] ?? {};
        if (!info.entity) continue;
        const tiledata = chunk.getTiledata(local, layer) || {};
        const tilePos = chunk.pos.times(World.CHUNK_SIZE).plus(local);
        if (info.entity === 'player') {
          World.spawnPos = tilePos.times(World.TILE_SIZE).plus(new Vec2(3, 0));
        }
        const entityInfo = Game.entities?.[info.entity];
        if (!entityInfo) continue;
        const ent = new entityInfo.class(
          tilePos.times(World.TILE_SIZE),
          tiledata
        );
        World.addEntity(ent);
        chunk.setTile(local, layer, null);
      }
    }
  }
};

GameplayState.destroyGameplay = function() {
  World.entities = [];
  World.chunkEntities = {};
  World.entityBuckets = {};
  World.spawnPos = new Vec2(0,0);
}

GameplayState.enter = function(payload) {
  UI.managers.gameplay = new UI.Manager();
  GameplayState.readyGameplay();
}

GameplayState.exit = function() {
  GameplayState.destroyGameplay();
  if (UI.managers.gameplay) UI.managers.gameplay.destroyAll();
  delete UI.managers.gameplay;
}

GameplayState.update = function(dt) {
  // back button (use editor button for now)
  UI.managers.gameplay.show('BackButton', () =>
    new EditorElements.BackButton(() => {
      EventBus.emit('state:request', 'main_menu');
    })
  );
  UI.managers.gameplay.tick();

  World.entities.forEach(e => e.update(dt));
}
