
import { EventBus } from "../core/eventBus.js"
import { World } from "../world/world.js"
import { UI } from "../ui/ui.js"
import { GameplayState } from "./gameplay.js"
import { EditorElements } from "../ui/editor.js"

export const EditorGameplayState = {}

EditorGameplayState.enter = function(payload) {
  UI.managers.editor_gameplay = new UI.Manager();
  GameplayState.readyGameplay();
}

EditorGameplayState.exit = function() {
  GameplayState.destroyGameplay();
  if (UI.managers.editor_gameplay) UI.managers.editor_gameplay.destroyAll();
  delete UI.managers.editor_gameplay;
}

EditorGameplayState.update = function(dt) {
  // back button (use editor button for now)
  UI.managers.editor_gameplay.show('BackButton', () =>
    new EditorElements.BackButton(() => {
      EventBus.emit('state:request', 'editor');
      EventBus.emit('worldio:load_autosave');
    })
  );
  UI.managers.editor_gameplay.tick();

  World.entities.forEach(e => e.update(dt));
}
