
const Gameplay = {}

Gameplay.init = function() {
  // setup keybinds
  InputManager.addKeybind('moveLeft', ['KeyA','ArrowLeft'])
  InputManager.addKeybind('moveRight', ['KeyD','ArrowRight'])
  InputManager.addKeybind('jump', ['KeyW','ArrowUp'])
  InputManager.addKeybind('crouch', ['KeyS','ArrowDown'])

  // setup world
  World.setTileAt(new Vec2(-10,0), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(-9,0), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(-8,0), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(-7,0), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(-6,0), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(-5,0), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(-4,0), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(-3,0), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(-2,0), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(-1,0), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(0,0), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(1,0), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(2,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(3,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(4,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(4,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(5,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(6,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(7,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(8,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(3,-3), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(4,-3), World.layers.GROUND, 'wall')

  World.player = new PlayerObject(new Vec2(4,-14));
}

Gameplay.update = function(dt) {

  World.player.update(dt);

  // update cam
  Game.cam.pos.x = World.player.pos.x + (Game.canvas.width/Game.dpr/Game.cam.zoom)/-2;
  Game.cam.pos.y = World.player.pos.y + (Game.canvas.height/Game.dpr/Game.cam.zoom)/-2;
}
