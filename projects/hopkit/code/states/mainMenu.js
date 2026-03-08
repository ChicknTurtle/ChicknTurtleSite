
import { Vec2 } from "./../utils/lib.js"
import { Game } from "./../game.js"
import { World } from "./../world/world.js"
import { EventBus } from "../core/eventBus.js"
import { UI } from "../ui/ui.js"
import { Elements } from "../ui/elements.js"
import { WorldRenderer } from "../world/rendering.js"

export const MainMenuState = {};

MainMenuState.enter = function (payload) {
  UI.managers.main_menu = new UI.Manager();
}

MainMenuState.exit = function () {
  if (UI.managers.main_menu) UI.managers.main_menu.destroyAll();
  delete UI.managers.main_menu;
}

MainMenuState.update = function (dt) {
  UI.managers.main_menu.show('singleplayer_button', () =>
    new Elements.MainMenuButton(new Vec2(0, -100), () => {
      EventBus.emit('state:request', 'gameplay');
    }, 'Singleplayer', true)
  );
  UI.managers.main_menu.show('multiplayer_button', () =>
    new Elements.MainMenuButton(new Vec2(0, -40), () => {
    }, 'Multiplayer', true)
  );
  UI.managers.main_menu.show('editor_button', () =>
    new Elements.MainMenuButton(new Vec2(0, 20), () => {
      EventBus.emit('state:request', 'editor');
    }, 'Level Editor')
  );
  UI.managers.main_menu.show('settings_button', () =>
    new Elements.MainMenuButton(new Vec2(0, 80), () => {
    }, 'Settings', true)
  );
  UI.managers.main_menu.tick();
  if (Game.isApp) {
    UI.managers.main_menu.show('quit_button', () =>
      new Elements.MainMenuButton(new Vec2(0, 140), () => {
        nw.App.closeAllWindows();
      }, 'Quit Game')
    );
  }

  World.cam.pos.x = (Game.canvas.width / Game.dpr / World.cam.zoom) / -2;
  World.cam.pos.y = (Game.canvas.height / Game.dpr / World.cam.zoom) / -2;
}

MainMenuState.draw = function (ctx) {
  // world
  ctx.save();
  ctx.scale(World.cam.zoom, World.cam.zoom);
  ctx.translate(-World.cam.pos.x, -World.cam.pos.y);
  WorldRenderer.draw(ctx);
  ctx.restore();

  // ui
  UI.managers.main_menu.draw(ctx)

  // version number
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '24px DigitalDisco';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`v${Game.jsons['manifest'].version}`, 10, Game.canvas.height / Game.dpr - 10);
}
