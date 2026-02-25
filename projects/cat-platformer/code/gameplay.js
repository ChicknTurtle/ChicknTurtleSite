
const Gameplay = {}

Gameplay.init = function() {
  // setup keybinds
  InputManager.addKeybind('moveLeft', ['KeyA','ArrowLeft'])
  InputManager.addKeybind('moveRight', ['KeyD','ArrowRight'])
  InputManager.addKeybind('jump', ['KeyW','ArrowUp'])
  InputManager.addKeybind('crouch', ['KeyS','ArrowDown'])

  // setup world
  for (let i = 0; i < 100; i++) {
    World.setTileAt(new Vec2(i-35,0), World.layers.GROUND, 'wall')
  }
  World.setTileAt(new Vec2(3,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(3,-2), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(3,-3), World.layers.GROUND, 'wall')

  World.setTileAt(new Vec2(10,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(10,-2), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(10,-3), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(10,-4), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(11,-2), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(11,-3), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(11,-4), World.layers.GROUND, 'wall')

  World.setTileAt(new Vec2(20,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(21,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(22,-1), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(20,-2), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(21,-2), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(22,-2), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(20,-4), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(21,-4), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(20,-5), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(21,-5), World.layers.GROUND, 'wall')
  World.setTileAt(new Vec2(22,-5), World.layers.GROUND, 'wall')

  World.player = new PlayerObject(new Vec2(4,-14));
}

Gameplay.update = function(dt) {

  World.player.update(dt);

  // update cam
  Game.cam.pos.x = World.player.getCameraAnchor().x + (Game.canvas.width/Game.dpr/Game.cam.zoom)/-2;
  Game.cam.pos.y = World.player.getCameraAnchor().y + (Game.canvas.height/Game.dpr/Game.cam.zoom)/-2;
}
