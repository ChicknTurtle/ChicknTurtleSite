// Requires TurtleLib

var te = {

    // Internal variables and functions

    /** Used to calculate dt each frame.
     * @type {number} */
    _prevTimestamp: 0,
    /** Used to calculate mouse velocity each frame.
     * @type {Vec2} */
    _prevMousePos: new Vec2(0,0),
    /** Keeps track of total number of created game objects, used to assign ids.
     * @type {number} */
    _createdObjects: 0,

    /** Logs a message to the console.  
     * Respects the `te.silent` boolean.
     * @param {string} msg Message to log */
    _log: function(msg) {
        if (!this.silent) {
            console.log(`[TurtleEngine] ${msg}`)
        }
    },
    /** Logs a warning to the console.  
     * Respects the `te.silent` boolean.
     * @param {string} msg Message to log */
    _logWarn: function(msg) {
        if (!this.silent) {
            console.warn(`[TurtleEngine] ${msg}`)
        }
    },
    /** Throws an error to the console.  
     * Doesn't respect the `te.silent` boolean.
     * @param {string} msg Error message to throw */
    _logError: function(msg) {
        console.error(`[TurtleEngine] ${msg}`)
    },
    /** Resizes canvas to fullscreen */
    _resizeCanvas: function() {
        if (this.handleResize) {
            this.canvas.width = window.innerWidth * this.dpr;
            this.canvas.height = window.innerHeight * this.dpr;
            this.canvas.style.width = window.innerWidth+'px';
            this.canvas.style.height = window.innerHeight+'px';
        }
    },
    /** Clears all pressed keys. */
    _killInputs: function() {
        this.keys = {};
        this.inputs = {};
    },
    /** Update an input.
     * @param {string} key KeyCode of changed key
     * @param {boolean} pressed Whether key is being pressed or unpressed
     * @returns {string[]} List of related inputs, if any */
    _updateInputKey: function(key, pressed) {
        if (pressed === true) {
            this.keys[key] = pressed;
        } else {
            delete this.keys[key];
        }
        if (this.keybinds[key]) {
            let inputArray = this.keybinds[key];
            if (!Array.isArray(inputArray)) {
                inputArray = [inputArray];
            }
            for (const input of inputArray) {
                if (pressed === true) {
                    this.inputs[input] = pressed;
                } else {
                    delete this.inputs[input];
                }
            }
            return inputArray;
        }
        return [];
    },
    _handleKeydown: function(event) {
        if (this.ignoreWhileCtrl && this.keys.ControlLeft || this.keys.ControlRight || this.keys.MetaLeft || this.keys.MetaRight) {
            return;
        }
        // prevent scrolling
        if (this.preventScroll && (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'ArrowDown')) {
            event.preventDefault();
        }
        let alreadyPressed = this.keys[event.code]
        let relatedInputs = this._updateInputKey(event.code, true);
        // handle key repeat
        if (alreadyPressed) {
            this.onKeyRepeat(event.code, relatedInputs);
        } else {
            this.onKeyPress(event.code, relatedInputs);
        }
    },
    _handleKeyup: function(event) {
        let relatedInputs = this._updateInputKey(event.code, false);
        this.onKeyRelease(event.code, relatedInputs);
    },
    _handleMousemove: function(event) {
        this.mouseHere = true;
        this.mousePos = new Vec2(event.clientX, event.clientY);
        this.onMouseMove(new Vec2(event.clientX, event.clientY));
    },
    _handleMouseleave: function(event) {
        this.mouseHere = false;
    },
    _handleMousedown: function(event) {
        this.mouseDown = true;
        this.onMouseClick(new Vec2(event.clientX, event.clientY));
    },
    _handleMouseup: function(event) {
        this.mouseDown = false;
        this.onMouseRelease(new Vec2(event.clientX, event.clientY));
    },
    _handleWheel: function(event) {
        if (this.preventScroll) {
            event.preventDefault();
        }
        this.onScroll(new Vec2(event.clientX, event.clientY), new Vec2(event.deltaX, event.deltaY));
    },
    _handleBlur: function(event) {
        this._killInputs();
        this.mouseDown = false;
    },
    _handleContextMenu: function(event) {
        if (this.preventContextMenu) {
            event.preventDefault();
        }
    },
    /** Sets up the engine.  
     * Called when user runs `te.start()`.
     * @param {string} canvasId The id of the canvas as defined in the html, needed to fetch and use the canvas object */
    _setup: function(canvasId) {
        // create canvas
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this._logError(`Canvas with id '${canvasId}' couldn't be found!`);
        }
        this.ctx = this.canvas.getContext('2d');
        this._resizeCanvas();
        // setup events
        this._handleKeydown = this._handleKeydown.bind(this);
        window.addEventListener('keydown', this._handleKeydown);
        this._handleKeyup = this._handleKeyup.bind(this);
        window.addEventListener('keyup', this._handleKeyup);
        this._handleMousemove = this._handleMousemove.bind(this);
        window.addEventListener('mousemove', this._handleMousemove);
        this._handleMouseleave = this._handleMouseleave.bind(this);
        window.addEventListener('mouseout', this._handleMouseleave);
        this._handleMousedown = this._handleMousedown.bind(this);
        window.addEventListener('mousedown', this._handleMousedown);
        this._handleMouseup = this._handleMouseup.bind(this);
        window.addEventListener('mouseup', this._handleMouseup);
        this._handleWheel = this._handleWheel.bind(this);
        window.addEventListener('wheel', this._handleWheel, { passive:false });
        this._handleBlur = this._handleBlur.bind(this);
        window.addEventListener('blur', this._handleBlur);
        this._handleContextMenu = this._handleContextMenu.bind(this);
        window.addEventListener('contextmenu', this._handleContextMenu);
    },
    /** Called once every frame (after the game has started).  
     * Handles internal game loop logic.
     * @param {number} timestamp Current js timestamp */
    _update: function(timestamp) {
        requestAnimationFrame(this._update.bind(this));
        this.dt = (timestamp - this._prevTimestamp)/1000;
        this.dt = Math.min(this.dt, 1/this.minFps);
        this.fps = 1/this.dt;
        this._prevTimestamp = timestamp;
        // update mouseVel
        this.mouseVel = this.mousePos.clone().subtract(this._prevMousePos);
        this._prevMousePos = this.mousePos;
        // destroy game objects
        te.objects = te.objects.filter(obj => !obj._destroyed);
        // tick game objects
        if (!this.pauseTicking) {
            this.objects.sort((a, b) => a.tickPriority - b.tickPriority);
            this.objects.forEach(object => {
                object.tick();
            });
        }
        // draw background
        this.dpr = window.devicePixelRatio || 1;
        this._resizeCanvas();
        let ctx = this.ctx;
        ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        if (this.bgColor) {
            ctx.fillStyle = this.bgColor;
            ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
            if (this.fullBg) {
                document.body.style.backgroundColor = this.bgColor;
            }
        }
        this.update(this.dt);
        // draw game objects
        if (!this.pauseDrawing) {
            ctx.save();
            ctx.scale(this.dpr,this.dpr)
            ctx.save();
            let centerX = this.canvas.width/2;
            let centerY = this.canvas.height/2;
            ctx.translate(centerX-this.scroll.x,centerY-this.scroll.y);
            ctx.scale(this.zoom,this.zoom)
            this.objects.sort((a, b) => a.drawPriority - b.drawPriority);
            this.objects.forEach(object => {
                ctx.save();
                if (object.drawWithoutTransform === true) {
                    ctx.scale(1/this.zoom,1/this.zoom);
                    ctx.translate(-centerX+this.scroll.x,-centerY+this.scroll.y);
                }
                object.draw();
                ctx.restore();
            });
            if (this.showHitboxes) {
                this.objects.forEach(object => {
                    ctx.save();
                    if (object.drawWithoutTransform === true) {
                        ctx.scale(1/this.zoom,1/this.zoom);
                        ctx.translate(-centerX+this.scroll.x,-centerY+this.scroll.y);
                    }
                    object.drawHitbox();
                    ctx.restore();
                });
            }
            ctx.restore();
        }
        // draw debug text
        ctx.font = '16px Courier New';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < this.debugText.length; i++) {
            ctx.strokeText(this.debugText[i], 12, i*20+70);
            ctx.fillText(this.debugText[i], 12, i*20+70);
        }
        ctx.restore();
    },

    // User-exposed variables, functions, and classes

    /** Short for delta time.  
     * The time since the last frame in seconds.  
     * Multiply value changes by this, to ensure everything moves the same speed no matter the game's frame rate.  
     * Example: `player.vy += 500 * te.dt;`
     * @type {number} */
    dt: 0,
    /** Current frames per second of the game, recalculated every frame.  
     * You can use `.toFixed(x)` to round to a certain number of decimal places.
     * @type {number} */
    fps: 0,
    /** Limit the internal fps and dt to a minimum value.  
     * If dt value is too high, it could cause skipped collisions for fast-moving objects.  
     * Instead, this causes the game to slow down while under the minimum fps.  
     * default = `10`
     * @type {number} */
    minFps: 10,
    /** Text that is automatically drawn on the screen for easy debugging.
     * @type {string[]} */
    debugText: [],
    /** A convenient place to store persistent game data.  
     * Example: `te.vars.playerX += 10*te.dt;`
     * @type {object} */
    vars: {},
    /** Whether or not the engine should be silent and not log things to console.  
     * Can be changed during runtime.  
     * default = `false`
     * @type {boolean} */
    silent: false,
    /** Stores all game objects.  
     * The order may change, you should use ids for identifying objects.
     * @type {te.GameObject[]} */
    objects: [],
    /** Stores the last game object spawned using `te.spawn()`,  
     * or `null` if `te.spawn()` was never used.
     * @type {te.GameObject|null} */
    lastSpawned: null,
    /** The main canvas, used to display the game.
     * @type {HTMLCanvasElement} */
    canvas: null,
    /** Device pixel ratio
     * @type {number} */
    dpr: window.devicePixelRatio || 1,
    /** Camera zoom
     * @type {number} */
    zoom: 1,
    /** Camera scroll vector
     * @type {Vec2} */
    scroll: new Vec2(),
    /** The canvas context, used to draw onto the canvas.
     * @type {CanvasRenderingContext2D} */
    ctx: null,
    /** Background color of the canvas.  
     * Also applies to the entire webpage if `te.fullBg` is true.
     * @type {string} */
    bgColor: null,
    /** If true, syncs the background color of the page with the canvas's background color.  
     * Useful when `te.handleResize` is also true.  
     * default = `true`
     * @type {boolean} */
    fullBg: true,
    /** If true, the engine automatically fits canvas to fill the window.  
     * Set to false if you want to have a canvas that doesn't take up the whole screen (or use an iframe).  
     * default = `true`
     * @type {boolean} */
    handleResize: true,
    /** If true, ignores all inputs while any of these keys are pressed:  
     * ControlLeft, ControlRight, MetaLeft, MetaRight
     * @type {boolean} */
    ignoreWhileCtrl: true,
    /** If true, prevents scrolling via mouse wheel, arrow keys, etc.
     * @type {boolean} */
    preventScroll: true,
    /** Keeps track of which keys are currently being pressed.
     * @type {Object.<string, boolean>} */
    keys: {},
    /** Keeps track of which inputs are active.  
     * Use `te.keybinds` to setup keybinds.
     * @type {Object.<string, boolean>} */
    inputs: {},
    /** Binds keys to inputs.  
     * These input names can be whatever you want, and can be an array of inputs.  
     * Find all key codes [here](https://www.toptal.com/developers/keycode/table).  
     * Examples: `te.keybinds.KeyD = 'right';`  
     * `te.keybinds.Space = ['jump','select'];`
     * @type {Object.<string, string|string[]>} */
    keybinds: {},
    /** Keeps track of mouse position on the screen.  
     * Use `te.getGamePos()` to convert to game pos.
     * @type {Vec2} */
    mousePos: new Vec2(),
    /** Keeps track of the mouse's current velocity.
     * @type {Vec2} */
    mouseVel: new Vec2(),
    /** Whether or not the mouse is over the window.
     * @type {boolean} */
    mouseHere: false,
    /** Whether or not the mouse is being pressed.
     * @type {boolean} */
    mouseDown: false,
    /** Whether or not the conext menu shown on right click should be prevented.
     * @type {boolean} */
    preventContextMenu: true,
    /** Whether debug hitboxes are displayed.
     * @type {boolean} */
    showHitboxes: false,
    /** Whether ticking game objects should be skipped.  
     * `te.update()` is still called
     * @type {boolean} */
    pauseTicking: false,
    /** Whether drawing game objects should be skipped.  
     * Background is still drawn
     * @type {boolean} */
    pauseDrawing: false,

    /** Initializes the engine.  
     * Should be called only once, when your game starts.
     * @param {string} canvasId The id of the canvas as defined in the html, needed to fetch and use the canvas object */
    start: function(canvasId='canvas') {
        this._log("\u{1F422} TurtleEngine initializing...");
        this._setup(canvasId);
        requestAnimationFrame(this._update.bind(this));
    },
    /** Don't call this function! Instead, overwrite it and use it as your game loop.  
     * Automatically called once every frame (after the game has started via `te.start()`).
     * @param {number} dt Time since the last frame in seconds */
    update: function(dt){},
    /** Can be used to spawn a game object.  
     * The object will be stored in `te.lastSpawned`.
     * @param {te.GameObject} object The GameObject to spawn */
    spawn: function(object){
        if (!object instanceof this.GameObject) {
            this._logWarn(`Tried to spawn a non-GameObject (${object})!`);
            return
        }
        this.lastSpawned = object;
        te.objects.push(object);
    },
    /** Overwrite this function and use it as a keydown event.  
     * Automatically called when a key is pressed, but ignores key repeat.  
     * Use `te.onKeyRepeat()` to listen to key repeating.
     * @param {string} key Code of the key that was pressed
     * @param {string[]} relatedInputs List of related inputs, if any */
    onKeyPress: function(key, relatedInputs){},
    /** Overwrite this function and use it as a keydown event.  
     * Automatically called when a key signal is repeated due to holding down the key.  
     * Use `te.onKeyPress()` to listen to the original key press.
     * @param {string} key Code of the key that was pressed
     * @param {string[]} relatedInputs List of related inputs, if any */
    onKeyRepeat: function(key, relatedInputs){},
    /** Overwrite this function and use it as a keyup event.  
     * Automatically called when a key is released.
     * @param {string} key Code of the key that was released
     * @param {string[]} relatedInputs List of related inputs, if any */
    onKeyRelease: function(key, relatedInputs){},
    /** Overwrite this function and use it as a mousedown event.  
     * Automatically called when the mouse is clicked.
     * @param {Vec2} pos Click position in screen pos */
    onMouseClick: function(mousePos){},
    /** Overwrite this function and use it as a mouseup event.  
     * Automatically called when the mouse is released.
     * @param {Vec2} pos Mouse position in screen pos */
    onMouseRelease: function(mousePos){},
    /** Overwrite this function and use it as a wheel event.  
     * Automatically called when the screen is scrolled.
     * @param {Vec2} pos Current mouse location on screen
     * @param {Vec2} delta Delta of scroll amount, you'll usually want delta.y */
    onScroll: function(pos,delta){},
    /** Get the screen pos from a game pos
     * @param {Vec2} pos Input pos */
    getScreenPos: function(pos) {
        let centerX = this.canvas.width/2;
        let centerY = this.canvas.height/2;
        return pos.clone().multiply(this.zoom).add(new Vec2(centerX-this.scroll.x,centerY-this.scroll.y));
    },
    /** Get the game pos from a screen pos
     * @param {Vec2} pos Input pos */
    getGamePos: function(pos) {
        let centerX = this.canvas.width/2;
        let centerY = this.canvas.height/2;
        return pos.clone().subtract(new Vec2(centerX-this.scroll.x,centerY-this.scroll.y)).divide(this.zoom);
    },

    /** The base game object class.  
     * Every game object has a pos, size, radius, tickPriority, drawPriority, and id.  
     * You can subclass game object classes to create new types of game objects. Just make sure to always call the parent class's contructor from the new class's.  
     * You can also overwrite their `tick()` and `draw()` functions, which are called automatically based on `tickPriority` and `drawPriority`.  
     * You can enable the `drawWithoutTransform` property for it to be drawn without zoom or translation.  
     * You can enable the `circularHitbox` property to make the hitbox act as a circle, with center at center of the object and diameter as the smallest of the object's width or height.
     * @param {Vec2} pos Starting pos of the object
     * @param {Vec2} size Size vector of the object's hitbox in pixels
     * @param {number} tickPriority Changes the order objects will be ticked in (lowest to highest)
     * @param {number} drawPriority Changes the order objects will be drawn in (lowest to highest) */
    GameObject: class {
        constructor(pos=new Vec2(),size=new Vec2(),tickPriority=0,drawPriority=0) {
            this.pos = pos.clone();
            if (size instanceof Vec2) {
                this.size = size.clone();
                this.radius = Math.min(size.x,size.y);
            } else {
                this.size = new Vec2(size);
                this.radius = size;
            }
            this.tickPriority = tickPriority;
            this.drawPriority = drawPriority;
            this.id = te._createdObjects;
            this.circularHitbox = false;
            this._hitboxColor = 'white';
            this._destroyed = false;
            te._createdObjects += 1;
        }
        tick(){}
        draw(){}
        collidesWith(obj) {
            if (!this.circularHitbox && !obj.circularHitbox) {
                return tlib.checkAABB(this,obj);
            } else if (this.circularHitbox && obj.circularHitbox) {
                return tlib.checkCirclular(this,obj);
            } else if (!this.circularHitbox && obj.circularHitbox) {
                return tlib.checkRectCircle(this,obj);
            } else if (this.circularHitbox && !obj.circularHitbox) {
                return tlib.checkRectCircle(obj,this);
            }
            return false;
        }
        /** Default function for drawing object hitbox (can be overridden)  
         * Draws at a constant size of 2 pixels on the screen with a difference filter  
         * Use `te.showHitboxes` to enable hitbox rendering on ALL objects */
        drawHitbox() {
            let ctx = te.ctx;
            ctx.save();
            ctx.strokeStyle = this._hitboxColor;
            //ctx.globalCompositeOperation = 'difference';
            ctx.lineWidth = 1;
            if (!this.drawWithoutTransform) {
                ctx.lineWidth /= te.zoom;
            }
            if (this.circularHitbox) {
                ctx.beginPath();
                ctx.arc(this.pos.x+this.radius,this.pos.y+this.radius,this.radius,0,2*Math.PI);
                ctx.stroke();
            } else {
                ctx.strokeRect(this.pos.x,this.pos.y,this.size.x,this.size.y);
            }
            ctx.restore();
        }
        /** Marks this object to be destroyed next frame */
        destroy() {
            this._destroyed = true;
        }
        toString() {
            return `GameObject: ${this.constructor.name} (${Math.round(this.pos.x)},${Math.round(this.pos.y)}) id:${this.id}`;
        }
    }
}