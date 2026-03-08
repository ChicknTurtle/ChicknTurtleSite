
import { EventBus } from "../core/eventBus.js"
import { World } from "../world/world.js"
import { WorldRenderer } from "../world/rendering.js"
import { UI } from "../ui/ui.js"
import { GameplayState } from "./gameplay.js"
import { EditorElements } from "../ui/editor.js"

export const EditorGameplayState = {}

EditorGameplayState.enter = function(payload) {
  UI.managers.editor_gameplay = new UI.Manager();

  EditorGameplayState._eb_stop_level = () => EditorGameplayState.stopLevel();
  EventBus.on('player:reached_goal', EditorGameplayState._eb_stop_level);

  GameplayState.readyGameplay();
}

EditorGameplayState.exit = function() {
  GameplayState.destroyGameplay();
  if (UI.managers.editor_gameplay) UI.managers.editor_gameplay.destroyAll();
  delete UI.managers.editor_gameplay;

  EventBus.off('player:reached_goal', EditorGameplayState._eb_stop_level); 
  EditorGameplayState._eb_stop_level = null;
}

EditorGameplayState.stopLevel = function() {
  EventBus.emit('state:request', 'editor');
  EventBus.emit('worldio:load_autosave');
}

EditorGameplayState.update = function(dt) {
  UI.managers.editor_gameplay.show('StopButton', () =>
    new EditorElements.PlayButton(() => {
      EditorGameplayState.stopLevel();
    })
  );
  UI.managers.editor_gameplay.tick();

  World.entities.forEach(e => e.update(dt));
}

EditorGameplayState.draw = function(ctx) {
  // world
  ctx.save();
  ctx.scale(World.cam.zoom, World.cam.zoom);
  ctx.translate(-World.cam.pos.x, -World.cam.pos.y);
  WorldRenderer.draw(ctx);
  ctx.restore();

  // ui
  UI.managers.editor_gameplay.draw(ctx)
}
