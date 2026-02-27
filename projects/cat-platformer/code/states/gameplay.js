
import { Vec2, tween } from "../lib.js"
import { Game } from "../game.js"
import { EventBus } from "../core/eventBus.js"
import { World } from "../world/world.js"
import { UI } from "../ui/ui.js"
import { PlayerObject } from "../player.js"
import { EditorElements } from "../ui/editor.js"

export const GameplayState = {}

GameplayState.enter = function(payload) {
  UI.managers.gameplay = new UI.Manager();
  // setup world
  World.player = new PlayerObject(new Vec2(4,-18));
}

GameplayState.exit = function() {
  delete World.player;
  if (UI.managers.gameplay) UI.managers.gameplay.destroyAll();
  delete UI.managers.gameplay;
}

GameplayState.update = function(dt) {
  // ui
  UI.managers.gameplay.tick();

  // back button (use editor button for now)
  UI.managers.gameplay.show('BackButton', () =>
    new EditorElements.BackButton(() => {
      EventBus.emit('state:request', 'main_menu');
    })
  );
  UI.managers.gameplay.tick();

  // player
  World.player.update(dt);

  // cam
  if (World.player) {
    Game.cam.pos.x = World.player.getCameraAnchor().x + (Game.canvas.width/Game.dpr/Game.cam.zoom)/-2;
    Game.cam.pos.y = World.player.getCameraAnchor().y + (Game.canvas.height/Game.dpr/Game.cam.zoom)/-2;
    Game.cam.pos.x = Math.floor(Game.cam.pos.x * Game.cam.zoom) / Game.cam.zoom;
    Game.cam.pos.y = Math.floor(Game.cam.pos.y * Game.cam.zoom) / Game.cam.zoom;
  }

}
