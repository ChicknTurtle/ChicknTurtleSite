
import { Vec2 } from "./../utils/lib.js"
import { Game } from "./../game.js"
import { StateManager } from "./stateManager.js"
import { EventBus } from "./eventBus.js"
import { World } from "./../world/world.js"
import { WorldRenderer } from "./../world/rendering.js"
import { UI } from "../ui/ui.js"
import { Text } from "./../text.js"
import { Editor } from "./../states/editor.js"

export const Renderer = {}

Renderer.draw = function(ctx) {
  ctx.imageSmoothingEnabled = false;

  // background
  //ctx.fillStyle = 'rgb(21,24,39)';
  ctx.fillStyle = '#00396d';
  ctx.clearRect(0,0,Game.canvas.width,Game.canvas.height);
  ctx.fillRect(0,0,Game.canvas.width,Game.canvas.height);

  // resize
  ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);

  StateManager.draw(ctx);

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
}
