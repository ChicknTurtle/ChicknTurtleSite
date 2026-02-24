
const Renderer = {}

Renderer.draw = function(ctx) {
  ctx.imageSmoothingEnabled = false;
  // background
  ctx.fillStyle = 'rgb(21,24,39)';
  ctx.clearRect(0,0,Game.canvas.width,Game.canvas.height);
  ctx.fillRect(0,0,Game.canvas.width,Game.canvas.height);
  // resize
  ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
  // world
  ctx.save();
  ctx.scale(Game.cam.zoom,Game.cam.zoom);
  ctx.translate(-Game.cam.pos.x, -Game.cam.pos.y);
  World.draw(ctx);
  ctx.restore();
  // debugText
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
