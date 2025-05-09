
// define custom particle class
class Particle extends te.GameObject {
    constructor(pos,type) {
        super(pos,new tlib.Vec2(),0,1);
        this.type = type;
    }
}
class MouseTrailParticle extends Particle {
    constructor(pos=new tlib.Vec2()) {
        super(pos,'mouseTrail');
        this.drawWithoutTransform = true;
        this.timeLived = 0;
        this.lifetime = tlib.randInt(50,100)/100;
        if (tlib.randInt(0,9)) {
            this.color = new tlib.Color(tlib.randInt(155,255),tlib.randInt(0,150),tlib.randInt(0,50));
        } else {
            this.color = new tlib.Color(100,100,100);
            this.lifetime += 0.5;
        }
        this.size = new tlib.Vec2(tlib.randInt(5,10));
        this.rotation = tlib.randInt(0,90);
        this.rotationSpeed = tlib.randInt(-10,10);
        this.pos.subtract(this.size.clone().divide(2));
        this.vel = new tlib.Vec2(tlib.randInt(-50,50),tlib.randInt(-150,-250));
    }
    tick() {
        this.timeLived += te.dt;
        this.pos.add(this.vel.clone().multiply(te.dt));
        this.size.add(new tlib.Vec2(te.dt*5));
        this.rotation += this.rotationSpeed;
        this.color.a = (1-this.timeLived/this.lifetime)*0.8;
        if (this.timeLived > this.lifetime) {
            this.destroy();
        }
    }
    draw() {
        let ctx = te.ctx;
        ctx.save();
        ctx.translate(this.pos.x+this.size.x/2,this.pos.y+this.size.y/2)
        ctx.rotate(this.rotation*Math.PI/180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size.x/2,-this.size.y/2,this.size.x,this.size.y);
        ctx.restore();
    }
}
// define custom ball game object
class Ball extends te.GameObject {
    constructor(pos,size) {
        super(pos,new tlib.Vec2(size,size));
    }
    draw() {
        let ctx = te.ctx;
        ctx.beginPath();
        let halfSize = this.size.x/2;
        ctx.arc(this.pos.x+halfSize,this.pos.y+halfSize,halfSize,0,2*Math.PI);
        ctx.fillStyle = "#0000ff";
        ctx.fill();
    }
}
// define mouse tracker game object that subclasses ball object
class MouseTracker extends Ball {
    constructor() {
        super(new tlib.Vec2(),10);
        this.drawPriority = 2;
        this.drawWithoutTransform = true;
    }
    tick() {
        // clone mouse pos so original isn't modified
        // add mouse velocity to make it look smoother
        // subtract size/2 so it is centered on mouse
        this.pos = te.mousePos.clone().add(te.mouseVel.clone().multiply(0.75))
        .subtract(new tlib.Vec2(this.size.x/2));
    }
    draw() {
        // hide if mouse isn't on screen
        if (!te.mouseHere) { return; }
        let ctx = te.ctx;
        ctx.beginPath();
        let halfSize = this.size.x/2;
        ctx.arc(this.pos.x+halfSize,this.pos.y+halfSize,halfSize,0,2*Math.PI);
        ctx.fillStyle = "#ff0000";
        ctx.fill();
    }
}

te.keyPressed = function(key, relatedInputs) {
    // toggle hitboxes if any hitboxes keybind pressed
    if (relatedInputs.includes('toggleHitboxes')) {
        te.showHitboxes = !te.showHitboxes;
    }
    // toggle game paused
    if (relatedInputs.includes('pause')) {
        te.pauseTicking = !te.pauseTicking;
    }
}

function start() {
    // setup background
    te.bgColor = "#151520";

    // define keybinds
    te.keybinds.KeyW = 'up';
    te.keybinds.KeyA = 'left';
    te.keybinds.KeyS = 'down';
    te.keybinds.KeyD = 'right';
    te.keybinds.ArrowUp = 'up';
    te.keybinds.ArrowLeft = 'left';
    te.keybinds.ArrowDown = 'down';
    te.keybinds.ArrowRight = 'right';
    te.keybinds.ShiftLeft = 'modifier';
    te.keybinds.ShiftRight = 'modifier';
    te.keybinds.Equal = 'zoomin';
    te.keybinds.Minus = 'zoomout';
    te.keybinds.KeyH = 'toggleHitboxes';
    te.keybinds.Escape = 'pause';
    te.keybinds.KeyP = 'pause';

    // setup custom vars
    te.vars.cam = new tlib.Vec2();
    te.vars.zoom = 1;
    te.vars.mouseTrailTimer = 0;
    te.vars.mouseTrailCost = 1/60;
    
    // start game using canvas with id 'gameCanvas' in the html
    te.start('gameCanvas');

    // spawn some game objects
    te.objects.push(new Ball(new tlib.Vec2(0,0),25));
    te.objects.push(new Ball(new tlib.Vec2(50,50),50));
    te.objects.push(new Ball(new tlib.Vec2(500,50),50));
    te.objects.push(new Ball(new tlib.Vec2(5000,50),200));
    //te.objects.push(new MouseTracker());
}

te.update = function(dt) {
    te.debugText = [];
    te.debugText.push(`dt: ${dt.toFixed(5)}`);
    te.debugText.push(`fps: ${te.fps.toFixed(3)}`);
    te.debugText.push(`keys: ${JSON.stringify(te.keys)}`);
    te.debugText.push(`inputs: ${JSON.stringify(te.inputs)}`);
    te.debugText.push(`scroll: ${te.scroll.x.toFixed()},${te.scroll.y.toFixed()}  zoom: ${(te.zoom*100).toFixed(2)}%`);
    if (te.mouseHere) {
        const mouseGamePos = te.getGamePos(te.mousePos);
        te.debugText.push(`mouse: ${mouseGamePos.x.toFixed()},${mouseGamePos.y.toFixed()}`);
    } else {
        te.debugText.push(`mouse: ?,?`);
    }
    te.debugText.push(`objects: ${te.objects.length}`);
    // zooming with origin correction
    let zoomDelta = 1.5 * te.zoom * te.dt;
    if (te.inputs.modifier) zoomDelta *= 2;
    let targetZoom = te.vars.zoom;
    if (te.inputs.zoomin) targetZoom += zoomDelta;
    if (te.inputs.zoomout) targetZoom -= zoomDelta;
    targetZoom = Math.min(4, Math.max(0.1, targetZoom));
    te.vars.zoom = targetZoom;
    te.zoom = tlib.tween(te.zoom, te.vars.zoom, Math.min(1, 10*te.dt));
    // scrolling
    let scrollDelta = 750 * te.zoom * te.dt;
    if (te.inputs.modifier) { scrollDelta *= 2.5; }
    scrollDelta *= 1/(0.5+Math.log2(1+te.zoom));
    if (te.inputs.left) { te.vars.cam.x -= scrollDelta; }
    if (te.inputs.right) { te.vars.cam.x += scrollDelta; }
    if (te.inputs.up) { te.vars.cam.y -= scrollDelta; }
    if (te.inputs.down) { te.vars.cam.y += scrollDelta; }
    te.scroll.x = tlib.tween(te.scroll.x, te.vars.cam.x, Math.min(1,10*te.dt));
    te.scroll.y = tlib.tween(te.scroll.y, te.vars.cam.y, Math.min(1,10*te.dt));

    // update mouse trail
    if (te.mouseHere) {
        te.vars.mouseTrailTimer += te.dt;
        for (let i = 0; i < Math.floor(te.vars.mouseTrailTimer/te.vars.mouseTrailCost); i++) {
            te.objects.push(new MouseTrailParticle(te.mousePos));
            te.vars.mouseTrailTimer -= te.vars.mouseTrailCost;
        }
    }

    // drawing

    // draw background grid
    let centerX = te.canvas.width/2;
    let centerY = te.canvas.height/2;
    this.ctx.fillStyle = "#202030";
    drawGrid(-te.scroll.x+centerX, -te.scroll.y+centerY, 50*te.zoom*te.dpr, 3*te.zoom*te.dpr);
}

function drawGrid(offsetX, offsetY, gridSize, gridThickness) {
    let canvas = te.canvas;
    let ctx = te.ctx;
    offsetX = ((offsetX % gridSize) + gridSize) % gridSize;
    offsetY = ((offsetY % gridSize) + gridSize) % gridSize;
    for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.fillRect(x-gridThickness/2, 0, gridThickness, canvas.height);
    }
    for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.fillRect(0, y-gridThickness/2, canvas.width, gridThickness);
    }
}
