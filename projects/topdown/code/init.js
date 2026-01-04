
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

function loadFont(name, src) {
  return new Promise((resolve, reject) => {
    const font = new FontFace(name, `url(${src})`);
    font.load().then(() => {
      document.fonts.add(font);
      resolve(font);
    }).catch(reject);
  });
}

async function loadAssets(assetList) {
  let loaded = 0;
  const total = assetList.length;
  Game.loading = [loaded, total];
  const promises = assetList.map(asset => {
    let loader;
    switch (asset.type) {
      case 'image':
        loader = loadImage(asset.src);
        break;
      case 'font':
        loader = loadFont(asset.name, asset.src);
        break;
      default:
        Game.loadingText = 'Assets failed to load, reload or check console';
        return Promise.reject(new Error(`Unknown asset type: ${asset.type}`));
    }
    return loader.then(loadedAsset => {
      loaded++;
      Game.loading = [loaded, total];
      return loadedAsset;
    }).catch(error => {
      Game.loadingText = 'Assets failed to load, reload or check console';
      return Promise.reject(error);
    });
  });
  return Promise.all(promises);
}

async function init() {
  // game setup
  Game.canvas = document.getElementById("gameCanvas");
  Game.ctx = Game.canvas.getContext("2d");
  UI.managers.main_menu = new UI.Manager();

  requestAnimationFrame(update);

  // load assets
  Game.loading = [0,0];
  const assets = await loadAssets([
    { type:'image', src:'assets/sheets/tileset.png' },
    { type:'image', src:'assets/sheets/ui.png' },
    { type:'image', src:'assets/sheets/editor.png' },
    { type:'image', src:'assets/sheets/player.png' },
    { type:'font', name:'Pixellari', src:'assets/fonts/Pixellari.ttf' },
  ]);
  // unpack
  [
    Game.spritesheets['tileset'],
    Game.spritesheets['ui'],
    Game.spritesheets['editor'],
    Game.spritesheets['player'],
    Game.fonts['Pixellari'],
  ] = assets;
  // load autosave
  const autosave = localStorage.getItem(`${Game.id}.autosave`);
  if (autosave) {
    const saveData = JSON.parse(autosave);
    WorldIO.loadSaveData(saveData);
    console.log('Loaded autosave.')
  } else {
    console.log('No autosave found.');
  }
  Game.loading = null;
}

function drawLoadingScreen(ctx, progress) {
  const canvas = Game.canvas;
  ctx.fillStyle = "rgb(0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const percent = progress[0]/progress[1];
  ctx.fillStyle = 'rgb(50,50,50)';
  ctx.fillRect(canvas.width*0.25, canvas.height/2-16, canvas.width/2, 32);
  ctx.fillStyle = 'rgb(255,255,255)';
  ctx.fillRect(canvas.width*0.25, canvas.height/2-16, canvas.width/2*percent, 32);
  ctx.globalCompositeOperation = 'difference';
  ctx.font = '24px Courier New';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(Game.loadingText, canvas.width/2, canvas.height/2-32);
}

function update(timestamp) {
  requestAnimationFrame(update);

  Game.debugText = [];
  // setup frame
  Game.dt = (timestamp - Game.lastTimestamp) / 1000;
  Game.gameTime += Game.dt;
  Game.dpr = window.devicePixelRatio;
  Game.canvas.width = window.innerWidth * Game.dpr;
  Game.canvas.height = window.innerHeight * Game.dpr;
  Game.fps = 1 / Game.dt;
  Game.lastTimestamp = timestamp;

  if (Game.loading) {
    Game.ctx.save();
    drawLoadingScreen(Game.ctx, Game.loading);
    Game.ctx.restore();
    return;
  }

  if (Game.mousePos) {
    Game.mouseGamePos = World.getGamePos(Game.mousePos);
  }

  // find mouse vel
  if (Game.mousePos && Game.prevMousePos) {
    Game.mouseVel = Game.mousePos.minus(Game.prevMousePos);
  } else {
    Game.mouseVel = new Vec2(0);
  }
  if (Game.mouseGamePos && Game.prevMouseGamePos) {
    Game.mouseGameVel = Game.mouseGamePos.minus(Game.prevMouseGamePos);
  } else {
    Game.mouseGameVel = new Vec2(0);
  }

  // debug toggles
  if (Game.inputsReleased['Backslash']) {
    if (!Game.ignoreNextDebugToggle) {
      Game.debugToggles['debugText'] = !Game.debugToggles['debugText'];
    }
    Game.ignoreNextDebugToggle = false;
  } else if (Game.inputs['Backslash']) {
    if (Game.inputsClicked['KeyG']) {
      Game.ignoreNextDebugToggle = true;
      Game.debugToggles['chunkGrid'] = !Game.debugToggles['chunkGrid'];
    }
    if (Game.inputsClicked['KeyH']) {
      Game.ignoreNextDebugToggle = true;
      Game.debugToggles['showHitboxes'] = !Game.debugToggles['showHitboxes'];
    }
  }

  // debug text
  Game.debugText.push(`fps: ${Game.fps.toFixed(2)}, dt: ${Game.dt.toFixed(5)}`);
  Game.debugText.push(`dpr: ${Game.dpr.toFixed(2)}, canvas: ${Game.canvas.width.toFixed(0)},${Game.canvas.height.toFixed(0)}`);
  Game.debugText.push(`zoom: ${Game.cam.zoom.toFixed(2)}, pos: ${Game.cam.pos.x.toFixed(0)},${Game.cam.pos.y.toFixed(0)}`);
  if (Game.mousePos) {
    Game.debugText.push(`mouse: ${Game.mousePos.x.toFixed(0)},${Game.mousePos.y.toFixed(0)} : ${World.getGamePos(Game.mousePos).x.toFixed(0)},${World.getGamePos(Game.mousePos).y.toFixed(0)}`);
  } else {
    Game.debugText.push('mouse: ?')
  }
  Game.debugText.push(`inputs: ${Object.keys(Game.inputs).join(', ')}`);
  Game.debugText.push(`keybinds: ${Object.keys(Game.keybinds).join(', ')}`);

  // ui
  if (Game.state === 'main_menu') {
    UI.managers.main_menu.show('play_button', () =>
      new UI.MenuButton(new Vec2(50,140), new Vec2(200,50), () => {
        Game.state = 'gameplay';
        World.player = new Player(new Vec2());
        delete Game.inputs['Mouse0'];
        delete Game.inputsClicked['Mouse0'];
      }, 'Play')
    );
    UI.managers.main_menu.show('editor_button', () =>
      new UI.MenuButton(new Vec2(50,200), new Vec2(200,50), () => {
        Game.state = 'editor';
        Editor.isEditing = true;
        delete Game.inputs['Mouse0'];
        delete Game.inputsClicked['Mouse0'];
      }, 'Editor')
    );
    UI.managers.main_menu.tick();
  } else {
    UI.managers.main_menu.destroyAll();
  }

  if (Game.state === 'gameplay') {
    Gameplay.tick();
  } else {
    //delete UI.managers.gameplay;
  }
  if (Game.state === 'editor') {
    Editor.tick();
  } else {
    delete UI.managers.editor;
  }

  draw(Game.ctx);

  Game.prevMousePos = Game.mousePos;
  Game.prevMouseGamePos = Game.mouseGamePos;
  Game.inputsClicked = {};
  Game.inputsReleased = {};
  Game.keybindsClicked = {};
  Game.keybindsReleased = {};
}

function draw(ctx) {
  let canvas = Game.canvas;
  // bg
  ctx.fillStyle = "rgb(0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(Game.dpr, Game.dpr);

  // draw world
  if (Game.state === 'main_menu' || Game.state === 'editor' || Game.state === 'gameplay') {  
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(Game.cam.zoom,Game.cam.zoom);
    ctx.translate(-Game.cam.pos.x,-Game.cam.pos.y);
    World.draw(ctx);
    ctx.restore();
  }

  // draw menus
  if (Game.state === 'main_menu') {
    UI.managers.main_menu.draw(ctx);
  }
  if (Game.state === 'gameplay') {
    Gameplay.draw(ctx);
  }
  if (Game.state === 'editor') {
    Editor.draw(ctx);
  }

  // debugText
  if (Game.debugToggles['debugText']) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '16px Courier New';
    for (let i = 0; i < Game.debugText.length; i++) {
      ctx.fillStyle = 'white';
      let text = new Text.Component(Game.debugText[i]);
      text.effects.shadow.pos.y = 1;
      Text.draw(ctx, text, new Vec2(10, i*20+20));
    }
  }
}

init();
