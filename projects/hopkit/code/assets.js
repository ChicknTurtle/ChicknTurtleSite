
import { Game } from "./game.js"

export const Assets = {}

Assets.load = async function() {
  Game.loading = [0,0];
  await Assets.loadAssets([
    { type:'json', name:'manifest', src:'package.json' },
    { type:'texture', name:'editor', src:'assets/textures/editor.png' },
    { type:'texture', name:'tiles', src:'assets/textures/tiles.png' },
    { type:'texture', name:'player', src:'assets/textures/player.png' },
    { type:'texture', name:'entities', src:'assets/textures/entities.png' },
    { type:'texture', name:'entityIcons', src:'assets/textures/entityIcons.png' },
    { type:'font', name:'Pixellari', src:'assets/fonts/Pixellari.ttf' },
    { type:'font', name:'DigitalDisco', src:'assets/fonts/DigitalDisco.ttf' },
    { type:'font', name:'LycheeSoda', src:'assets/fonts/LycheeSoda.ttf' },
  ]);
  Game.loading = null;

  // setup flipped textures
  Game.textures['player_flipped'] = Assets.getFlippedTexture(Game.textures['player'], 32);
}

Assets.loadTexture = function(name, src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      Game.textures[name] = img;
      resolve(img);
    }
    img.onerror = reject;
  });
}

Assets.loadFont = function(name, src) {
  return new Promise((resolve, reject) => {
    const font = new FontFace(name, `url(${src})`);
    font.load().then(() => {
      document.fonts.add(font);
      Game.fonts[name] = font;
      resolve(font);
    }).catch(reject);
  });
}

Assets.loadJson = function(name, src) {
  return new Promise((resolve, reject) => {
    fetch(src).then(response => {
      if (!response.ok) throw new Error(`Failed to load JSON: ${src}`);
      return response.json();
    }).then(json => {
      Game.jsons[name] = json;
      resolve(json);
    }).catch(reject);
  });
}

Assets.loadAssets = async function(assetList) {
  let loaded = 0;
  const total = assetList.length;
  Game.loading = [loaded, total];
  const promises = assetList.map(asset => {
    let loader;
    switch (asset.type) {
      case 'texture':
        loader = Assets.loadTexture(asset.name, asset.src);
        break;
      case 'font':
        loader = Assets.loadFont(asset.name, asset.src);
        break;
      case 'json':
        loader = Assets.loadJson(asset.name, asset.src);
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

Assets.drawLoadingScreen = function(ctx, progress) {
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

Assets.getFlippedTexture = function(img, spriteSize=16) {
  const cols = Math.floor(img.width / spriteSize);
  const rows = Math.floor(img.height / spriteSize);
  const canvas = document.createElement('canvas');
  canvas.width = cols * spriteSize;
  canvas.height = rows * spriteSize;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const sx = x * spriteSize;
      const sy = y * spriteSize;
      const dx = sx;
      const dy = sy;
      ctx.save();
      ctx.translate(dx + spriteSize, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(
        img,
        sx, sy, spriteSize, spriteSize,
        0, 0, spriteSize, spriteSize
      );
      ctx.restore();
    }
  }

  return canvas;
};
