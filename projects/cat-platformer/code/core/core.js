
import { Vec2 } from "./../lib.js"
import { Game } from "./../game.js"
import { InputManager } from "./../inputs.js"
import { EventBus } from "./../core/eventBus.js"
import { StateManager } from "./../core/stateManager.js"
import { Editor } from "./../editor.js"
import { World } from "./../world/world.js"
import { WorldIO } from "./../world/io.js"
import { UI } from "./../ui/managers.js"
import { Elements } from "../ui/elements.js"
import { Gameplay } from "../core/gameplay.js"
import { PlayerObject } from "./../player.js"

export const Core = {}

Core.init = function() {
  // setup keybinds
  InputManager.addKeybind('moveLeft', ['KeyA','ArrowLeft'])
  InputManager.addKeybind('moveRight', ['KeyD','ArrowRight'])
  InputManager.addKeybind('jump', ['KeyW','ArrowUp'])
  InputManager.addKeybind('crouch', ['KeyS','ArrowDown'])

  // wire statemanager events
  EventBus.on('state:request', (name) => {
    StateManager.change(name);
  });

  // register main menu state
  StateManager.register('main_menu', {
    enter() {
      UI.managers.main_menu = new UI.Manager();
      World.player = new PlayerObject(new Vec2(4,-18));
    },
    update(dt) {
      UI.managers.main_menu.show('singleplayer_button', () =>
        new Elements.MainMenuButton(new Vec2(0,-100), () => {
          EventBus.emit('state:request', 'gameplay');
        }, 'Singleplayer')
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
    },
    exit() {
      if (UI.managers.main_menu) UI.managers.main_menu.destroyAll();
      delete UI.managers.main_menu;
    }
  });

  // register gameplay state
  StateManager.register('gameplay', {
    enter() {
      UI.managers.gameplay = new UI.Manager();
      Gameplay.init();
    },
    update(dt) {
      UI.managers.gameplay.tick();
      Gameplay.update(dt);
    },
    exit() {
      if (UI.managers.gameplay) UI.managers.gameplay.destroyAll();
      delete UI.managers.gameplay;
    }
  });

  // register editor state
  StateManager.register('editor', { enter:Editor.enter, update:Editor.update, exit:Editor.exit });

  // load autosave
  const autosave = localStorage.getItem(`${Game.id}.autosave`);
  if (autosave) {
    const saveData = JSON.parse(autosave);
    WorldIO.loadSaveData(saveData);
    console.log('Loaded autosave.')
  } else {
    console.log('No autosave found.');
  }

  StateManager.change('main_menu');
}

Core.update = function(dt) {
  StateManager.update(dt);
}
