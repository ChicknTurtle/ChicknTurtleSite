
import { Vec2 } from "./../lib.js"
import { Game } from "./../game.js"
import { StateManager } from "./stateManager.js"
import { EventBus } from "./eventBus.js"
import { WorldRenderer } from "./../world/rendering.js"
import { UI } from "./../ui/managers.js"
import { Text } from "./../text.js"
import { Editor } from "./../editor.js"

export const Renderer = {}

Renderer.draw = function(ctx) {
  ctx.imageSmoothingEnabled = false;

  EventBus.emit('render:frame:before', { ctx });

  // background
  ctx.fillStyle = 'rgb(21,24,39)';
  ctx.clearRect(0,0,Game.canvas.width,Game.canvas.height);
  ctx.fillRect(0,0,Game.canvas.width,Game.canvas.height);

  // resize
  ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);

  const state = StateManager.current;

  // draw world
  EventBus.emit('render:world:before', { ctx, state });

  if (state === 'main_menu' || state === 'editor' || state === 'gameplay') {
    ctx.save();
    ctx.scale(Game.cam.zoom, Game.cam.zoom);
    ctx.translate(-Game.cam.pos.x, -Game.cam.pos.y);
    WorldRenderer.draw(ctx);
    EventBus.emit('render:world:after', { ctx, state });
    ctx.restore();
  } else {
    EventBus.emit('render:world:after', { ctx, state });
  }

  // draw ui

  EventBus.emit('render:ui:before', { ctx, state });

  if (state === 'main_menu') {
    if (UI.managers.main_menu) UI.managers.main_menu.draw(ctx);
    EventBus.emit('render:ui:main_menu', { ctx });
  } else if (state === 'editor') {
    EventBus.emit('render:ui:editor', { ctx });
    Editor.draw(ctx);
  } else if (state === 'gameplay') {
    if (UI.managers.gameplay) UI.managers.gameplay.draw(ctx);
    EventBus.emit('render:ui:gameplay', { ctx });
  } else {
    EventBus.emit('render:ui:other', { ctx, state });
  }

  EventBus.emit('render:ui:after', { ctx, state });

  if (Game.debugToggles['debugText']) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '16px Courier New';
    ctx.fillStyle = 'white';
    for (let i = 0; i < Game.debugText.length; i++) {
      let text = new Text.Component(Game.debugText[i]);
      text.effects.shadowColor = 'rgb(0,0,0)';
      text.effects.shadowOffset = new Vec2(0,1);
      text.draw(ctx, new Vec2(10, i*20+20));
    }
  }

  EventBus.emit('render:frame:after', { ctx });
}
