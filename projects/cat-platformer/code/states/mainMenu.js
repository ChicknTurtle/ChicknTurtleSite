
import { Vec2 } from "./../lib.js"
import { Game } from "./../game.js"
import { EventBus } from "../core/eventBus.js"
import { UI } from "../ui/ui.js"
import { Elements } from "../ui/elements.js"

export const MainMenuState = {};

MainMenuState.enter = function(payload) {
  UI.managers.main_menu = new UI.Manager();
}

MainMenuState.exit = function() {
  if (UI.managers.main_menu) UI.managers.main_menu.destroyAll();
  delete UI.managers.main_menu;
}

MainMenuState.update = function(dt) {
  UI.managers.main_menu.show('singleplayer_button', () =>
  new Elements.MainMenuButton(new Vec2(0,-100), () => {
    EventBus.emit('state:request', 'gameplay');
  }, 'Singleplayer', true)
  );
  UI.managers.main_menu.show('multiplayer_button', () =>
  new Elements.MainMenuButton(new Vec2(0,-40), () => {
  }, 'Multiplayer', true)
  );
  UI.managers.main_menu.show('editor_button', () =>
  new Elements.MainMenuButton(new Vec2(0,20), () => {
    EventBus.emit('state:request', 'editor');
  }, 'Level Editor')
  );
  UI.managers.main_menu.show('settings_button', () =>
  new Elements.MainMenuButton(new Vec2(0,80), () => {
  }, 'Settings', true)
  );
  UI.managers.main_menu.tick();

  Game.cam.pos.x = (Game.canvas.width/Game.dpr/Game.cam.zoom)/-2;
  Game.cam.pos.y = (Game.canvas.height/Game.dpr/Game.cam.zoom)/-2;
}
