
function setCursor(type) {
  document.documentElement.style.cursor = `url('assets/sprites/cursors/${type}.png') 10 5, auto`;
}

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
  Game.loading = [0, 0];
  const assets = await loadAssets([
    { type: 'image', src: 'assets/sprites/digits.png' },
    { type: 'image', src: 'assets/sprites/100.png' },
    { type: 'image', src: 'assets/sprites/ui.png' },
    { type: 'image', src: 'assets/sprites/buttons.png' },
    { type: 'image', src: 'assets/sprites/meter.png' },
    { type: 'font', name: 'Pixellari', src: 'assets/fonts/Pixellari.ttf' },
    { type: 'font', name: 'LycheeSoda', src: 'assets/fonts/LycheeSoda.ttf' },
    { type: 'font', name: 'DigitalDisco', src: 'assets/fonts/DigitalDisco.ttf' },
  ]);
  // unpack
  [
    Game.spritesheets['digits'],
    Game.spritesheets['100'],
    Game.spritesheets['ui'],
    Game.spritesheets['buttons'],
    Game.spritesheets['meter'],
    Game.fonts['Pixellari'],
    Game.fonts['LycheeSoda'],
    Game.fonts['DigitalDisco'],
  ] = assets;
  Game.loading = null;
  setCursor('default');
}

function drawLoadingScreen(ctx, progress) {
  const canvas = Game.canvas;
  ctx.fillStyle = "rgb(0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const percent = progress[0] / progress[1];
  ctx.fillStyle = 'rgb(50,50,50)';
  ctx.fillRect(canvas.width * 0.25, canvas.height / 2 - 16, canvas.width / 2, 32);
  ctx.fillStyle = 'rgb(255,255,255)';
  ctx.fillRect(canvas.width * 0.25, canvas.height / 2 - 16, canvas.width / 2 * percent, 32);
  ctx.globalCompositeOperation = 'difference';
  ctx.font = '24px Courier New';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(Game.loadingText, canvas.width / 2, canvas.height / 2 - 32);
}

function update(timestamp) {
  requestAnimationFrame(update);

  Game.debugText = [];
  // setup frame
  Game.dt = (timestamp - Game.lastTimestamp) / 1000;
  Game.gameTime += Game.dt;
  Game.dpr = window.devicePixelRatio || 1;
  const rect = Game.canvas.getBoundingClientRect();
  Game.canvas.width = Math.floor(rect.width * Game.dpr);
  Game.canvas.height = Math.floor(rect.height * Game.dpr);
  Game.fps = 1 / Game.dt;
  Game.lastTimestamp = timestamp;

  if (Game.loading) {
    Game.ctx.save();
    drawLoadingScreen(Game.ctx, Game.loading);
    Game.ctx.restore();
    return;
  }

  // find mouse vel
  if (Game.mousePos && Game.prevMousePos) {
    Game.mouseVel = Game.mousePos.minus(Game.prevMousePos);
  } else {
    Game.mouseVel = new Vec2(0);
  }

  // debug toggles
  if (Game.inputsReleased['Backslash']) {
    if (!Game.ignoreNextDebugToggle) {
      Game.debugToggles['debugText'] = !Game.debugToggles['debugText'];
    }
    Game.ignoreNextDebugToggle = false;
  } else if (Game.inputs['Backslash']) {
    if (Game.inputsClicked['KeyH']) {
      Game.ignoreNextDebugToggle = true;
      Game.debugToggles['showHitboxes'] = !Game.debugToggles['showHitboxes'];
    }
  }

  // debug text
  Game.debugText.push(`fps: ${Game.fps.toFixed(2)}, dt: ${Game.dt.toFixed(5)}`);
  Game.debugText.push(`dpr: ${Game.dpr.toFixed(2)}, canvas: ${Game.canvas.width.toFixed(0)},${Game.canvas.height.toFixed(0)}`);
  if (Game.mousePos) {
    Game.debugText.push(`mouse: ${Game.mousePos.x.toFixed(0)},${Game.mousePos.y.toFixed(0)}`);
  } else {
    Game.debugText.push('mouse: ?')
  }
  Game.debugText.push(`inputs: ${Object.keys(Game.inputs).join(', ')}`);
  Game.debugText.push(`keybinds: ${Object.keys(Game.keybinds).join(', ')}`);

  // game logic
  if (Game.shuffleTimeRemaining > 0) {
    Game.shuffleTimeRemaining -= Game.dt;
    if (Game.shuffleTimeRemaining <= 0) {
      Game.shuffleTimeRemaining = 0;
      Game.percentage = Game.finalPercentage;
      Game.reenableButtonIn = 1;
      if (Game.finalPercentage == 0) {
        UI.managers.main_menu.elements['meter'].meter = 0;
      } else {
        UI.managers.main_menu.elements['meter'].meter += Game.finalPercentage;
      }
    } else {
      Game.percentage = Math.floor(Math.random() * 100);
    }
  }
  if (Game.reenableButtonIn > 0) {
    Game.reenableButtonIn -= Game.dt;
    if (Game.reenableButtonIn <= 0) {
      Game.reenableButtonIn = 0;
      UI.managers.main_menu.elements['roll_button'].disabled = false;
    }
  }

  // ui
  setCursor('default');
  if (Game.state === 'main_menu') {
    UI.managers.main_menu.show('roll_button', () => {
      const b = new UI.GameButton(new Vec2(0, 30), new Vec2(128, 64), () => {
        if (b.disabled) return;
        delete Game.inputs['Mouse0'];
        delete Game.inputsClicked['Mouse0'];
        b.disabled = true;
        b.pressedAt = Game.gameTime;

        Game.finalPercentage = Math.floor(Math.random() * 101);
        const base = 0.5 + 3.5 * Math.pow(Math.random(), 20);
        const extra = 1.70 * Math.pow(Game.finalPercentage / 100, 1.85);
        Game.shuffleTimeRemaining = base + 0.75 + extra;
        if (Game.finalPercentage === 100) {
          Game.shuffleTimeRemaining += 1.0;
        }
      }, 'Roll');
      b.anchor = UI.anchor('center', 'center');
      b.pivot = UI.anchor('center', 'center');
      return b;
    });
    UI.managers.main_menu.show('main_text1', () => {
      const t = new UI.TextLabel(new Vec2(-72, -50), 'You are', '32px DigitalDisco', 'white');
      t.anchor = UI.anchor('center', 'center');
      t.textAlign = 'right';
      return t;
    });
    UI.managers.main_menu.show('main_text2', () => {
      const t = new UI.TextLabel(new Vec2(72, -50), 'hydrated!', '32px DigitalDisco', 'white');
      t.anchor = UI.anchor('center', 'center');
      t.textAlign = 'left';
      return t;
    });
    UI.managers.main_menu.show('meter', () => {
      const m = new UI.Meter(new Vec2(0, -128));
      m.anchor = UI.anchor('center', 'center');
      m.pivot = UI.anchor('center', 'center');
      m.onClick = () => {
        m.meter = 0;
      }
      return m;
    });
    /*UI.managers.main_menu.show('settings_button', () => {
      const b = new UI.SettingsButton(new Vec2(0, 0), new Vec2(50, 50), () => {
        
      });
      b.anchor = UI.anchor('right', 'top');
      b.pivot = UI.anchor('right', 'top');
      return b;
    });*/
    UI.managers.main_menu.tick();
  } else {
    UI.managers.main_menu.destroyAll();
  }

  if (Game.keybindsClicked['roll']) {
    const rollButton = UI.managers.main_menu.elements['roll_button'];
    if (rollButton && !rollButton.disabled) {
      rollButton?.onClick();
    }
  }

  draw(Game.ctx);

  Game.prevMousePos = Game.mousePos;
  Game.inputsClicked = {};
  Game.inputsReleased = {};
  Game.keybindsClicked = {};
  Game.keybindsReleased = {};
}

function draw(ctx) {
  let canvas = Game.canvas;
  // bg
  ctx.fillStyle = 'rgba(61, 31, 82, 1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.scale(Game.dpr, Game.dpr);

  UI.managers.main_menu.draw(ctx);

  drawPercentage(ctx, new Vec2(0, -55), 0, 3, new Vec2(0.5, 0.5), new Vec2(0.5, 0.5));

  // debugText
  if (Game.debugToggles['debugText']) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '16px Courier New';
    for (let i = 0; i < Game.debugText.length; i++) {
      ctx.fillStyle = 'white';
      let text = new Text.Component(Game.debugText[i]);
      text.effects.shadow.pos.y = 1;
      Text.draw(ctx, text, new Vec2(10, i * 20 + 20));
    }
  }
}

init();
