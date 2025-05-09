
import { getGamePos, translateSnapped } from "./utils.js";
import { Game } from "./gameCore.js";
import { gameLoop, drawGame } from "./gameLoop.js";

function updateInputs() {
    let keys = Game.keys
    Game.inputs.left = false;
    if (keys.ArrowLeft || keys.KeyA) {
        Game.inputs.left = true;
    }
    Game.inputs.right = false;
    if (keys.ArrowRight || keys.KeyD) {
        Game.inputs.right = true;
    }
    Game.inputs.jump = false;
    if (keys.ArrowUp || keys.Space) {
        Game.inputs.jump = true;
    }
}

export function setupGame() {

    // setup game loop
    Game.tick = gameLoop;
    Game.draw = drawGame;
    
    // setup canvas

    Game.canvas = {
        canvas: document.createElement("canvas"),
        start: function () {
            this.context = this.canvas.getContext("2d");
            document.body.insertBefore(this.canvas, document.body.childNodes[0]);
            this.resize()
            // handle window resizing
            window.addEventListener('resize', this.resize);
            window.addEventListener('orientationchange', this.resize);
        },
        clear: function () {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        },
        resize: function () {
            const c = Game.canvas;
            const width = window.innerWidth;
            const height = window.innerHeight;
            const dpr = window.devicePixelRatio || 1;
        
            // 1) set the CSS display size
            c.canvas.style.width  = width  + 'px';
            c.canvas.style.height = height + 'px';
        
            // 2) set the internal resolution
            c.canvas.width  = Math.floor(width  * dpr);
            c.canvas.height = Math.floor(height * dpr);
        
            // 3) reset any prior transforms, then scale once
            if (c.context.resetTransform) {
                c.context.resetTransform();
            } else {
                c.context.setTransform(1, 0, 0, 1, 0, 0);
            }
            c.context.scale(dpr, dpr);
        }
    }

    // setup inputs

    // listen to key inputs and prevent default behavior
    window.addEventListener('keydown', function (event) {
        Game.keys[event.code] = true;
        updateInputs();
        let preventKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];
        if (preventKeys.includes(event.code)) {
            event.preventDefault();
        }
        // custom keys
        if (event.code === 'KeyH') {
            Game.showhitboxes = !Game.showhitboxes;
            console.log(`Hitboxes toggled to ${Game.showhitboxes}`);
        }
        if (event.code === 'KeyP') {
            Game.paused = !Game.paused;
            console.log(`Game paused toggled to ${Game.paused}`);
        }
        if (event.code === 'KeyO') {
            Game.stepOneFrame = true;
        }
        // zoom
        const isMac = navigator.userAgentData?.platform?.toLowerCase().includes('mac') ||
                      navigator.userAgent.toLowerCase().includes('mac');
        const isZoomKey = (isMac && event.metaKey && !event.ctrlKey) ||
                          (!isMac && event.ctrlKey && !event.metaKey);
        if (isZoomKey && (event.code === 'Equal' || event.code === 'Minus' || event.code === 'Digit0')) {
            if (event.code === 'Equal') Game.zoom += 0.1;
            if (event.code === 'Minus') Game.zoom -= 0.1;
            if (event.code === 'Digit0') Game.zoom = 1;
            // min 100% max 400%
            Game.zoom = Math.max(1, Math.min(Game.zoom, 4));
            event.preventDefault();
            console.log(`Zoom changed to ${(Game.zoom*100).toFixed(2)}%`);
        }
    });
    window.addEventListener('keyup', function (event) {
        Game.keys[event.code] = false;
        updateInputs();
    });
    // disable right-click menu
    window.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    });
    // listen to mouse inputs
    window.addEventListener('mousemove', (event) => {
        let rect = Game.canvas.canvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;
        const cx = Game.canvas.canvas.clientWidth / 2;
        const cy = Game.canvas.canvas.clientHeight / 2;
        let zoomedX = (mouseX - cx) / Game.zoom + cx;
        let zoomedY = (mouseY - cy) / Game.zoom + cy;
        let pos = getGamePos(zoomedX, zoomedY);
        Game.mousePos = pos;
    });
}

export function loadAssets(callbackWhenReady) {

    let totalAssets = 0;
    let loadedAssets = 0;

    Game.spritesheets = {};
    Game.sounds = {};

    function assetLoaded() {
        loadedAssets++;
        if (loadedAssets === totalAssets) {
            console.log(`Finished loading ${totalAssets} assets!`);
            if (callbackWhenReady) callbackWhenReady();
        }
    }

    function loadSpritesheet(name, url, spriteWidth, spriteHeight) {
        totalAssets++;
        const image = new Image();
        image.src = url;
        image.onload = function () {
            const spriteAmountX = Math.floor(image.width / spriteWidth);
            const spriteAmountY = Math.floor(image.height / spriteHeight);
            let spritesheet = {
                image: image,
                imageWidth: image.width,
                imageHeight: image.height,
                spriteWidth: spriteWidth,
                spriteHeight: spriteHeight,
                spriteAmountX: spriteAmountX,
                spriteAmountY: spriteAmountY,
                frames: [],
            };
            for (let y = 0; y < spriteAmountY; y++) {
                for (let x = 0; x < spriteAmountX; x++) {
                    let frameX = x * spriteWidth;
                    let frameY = y * spriteHeight;
                    spritesheet.frames.push({
                        x: frameX,
                        y: frameY,
                        width: spriteWidth,
                        height: spriteHeight,
                        draw: function (pos, offsetX=0, offsetY=0, angle=0) {
                            let ctx = Game.canvas.context;
                            ctx.save();
                            ctx.imageSmoothingEnabled = false;
                            translateSnapped(ctx, pos.x, pos.y);
                            ctx.rotate(angle);
                            ctx.drawImage(spritesheet.image,
                                frameX, frameY,
                                spriteWidth, spriteHeight,
                                offsetX, offsetY,
                                spriteWidth * Game.pixelScale,
                                spriteHeight * Game.pixelScale
                            );
                            ctx.restore();
                        },
                    });
                }
            }
            Game.spritesheets[name] = spritesheet;
            console.log(`Loaded spritesheet: ${name}`);
            assetLoaded();
        };
        image.onerror = function () {
            console.error(`Error loading ${url}`);
            assetLoaded();
        };
    }
    function loadSound(name, url) {
        totalAssets++;
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => Game.actx.decodeAudioData(arrayBuffer))
            .then(decodedBuffer => {
                Game.sounds[name] = {
                    buffer: decodedBuffer,
                    play: function (volume=1.0,pan=0.0) {
                        const source = Game.actx.createBufferSource();
                        source.buffer = this.buffer;
                        const gainNode = Game.actx.createGain();
                        gainNode.gain.value = volume;
                        const panner = Game.actx.createStereoPanner();
                        panner.pan.value = pan;
                        source.connect(gainNode);
                        gainNode.connect(panner);
                        panner.connect(Game.actx.destination);
                        source.start(0);
                        return source;
                    }
                };
                console.log(`Loaded sound: ${name}`);
                assetLoaded();
            })
            .catch(err => {
                console.error(`Error loading sound: ${url}`, err);
                assetLoaded();
            });
    }

    loadSpritesheet('frog', 'assets/sprites/frog.png', 21, 21);
    loadSpritesheet('platforms', 'assets/sprites/platforms.png', 21, 17);

    // https://sfxr.me/#11111BEmL4w7tmxXLYypHfXZsCBG8bfoX2mA5EGPmbQ4655phgSkfRKveTpfCXMwZLJoqcCW7UXf1m7YroZVp2u2FRNjs1rDqrjDdKYkHerDorYUd3VQmTTd
    loadSound('smallJump', 'assets/sounds/smallJump.wav');
    // https://sfxr.me/#111117LqRCiWWyAFaJ2Bs7L8MDK8WwLzN3mw9JT5KNdwWD9DGqDNMik998nyGLw1kNyXg7AYoJWk2PbrihXnM81oQXofiKNjV9X6mjKCCpxUJGw8SoyJKzTy
    loadSound('superJump', 'assets/sounds/superJump.wav');
    // https://sfxr.me/#7BMHBGLG4vRkaCueVkMCQhZSvsdgtWYsktGLZzrWA92J8W4u4bxhNktrTToKhLAZsQP5m97BaDQtuTKQyAHrc1D5TkKdMxSaTGFiQs3UJGDd6PyvQ3LvP3rj9
    loadSound('landOnPlatform', 'assets/sounds/landOnPlatform.wav');
}
