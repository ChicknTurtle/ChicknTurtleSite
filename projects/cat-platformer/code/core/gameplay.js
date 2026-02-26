
import { Vec2, tween } from "./../lib.js"
import { Game } from "./../game.js"
import { World } from "./../world/world.js"
import { UI } from "./../ui/managers.js"
import { PlayerObject } from "./../player.js"
import { EditorElements } from "../ui/editor.js"

export const Gameplay = {}

Gameplay.init = function() {
  // setup world
  World.player = new PlayerObject(new Vec2(4,-18));
}

Gameplay.update = function(dt) {
  // ui
  // back button
  UI.managers.gameplay.show('BackButton', () =>
    new EditorElements.BackButton()
  );
  UI.managers.gameplay.tick();

  // player
  World.player.update(dt);

  // cam
  if (World.player) {
    Game.cam.anchor.x = World.player.getCameraAnchor().x + (Game.canvas.width/Game.dpr/Game.cam.zoom)/-2;
    Game.cam.anchor.y = World.player.getCameraAnchor().y + (Game.canvas.height/Game.dpr/Game.cam.zoom)/-2;
  }
  Game.cam.pos.x = tween(Game.cam.pos.x, Game.cam.anchor.x, 0.99, dt);
  Game.cam.pos.y = tween(Game.cam.pos.y, Game.cam.anchor.y, 0.99, dt);
}
