
// define custom particle class
class Particle extends te.GameObject {
    constructor(pos,type) {
        super(pos,new Vec2(),0,1);
        this.type = type;
    }
}
class MouseTrailParticle extends Particle {
    constructor(pos=new Vec2()) {
        super(pos,'mouseTrail');
        this.timeLived = 0;
        this.lifetime = randInt(50,100)/100;
        if (randInt(0,9)) {
            this.color = new Color(randInt(155,255),randInt(0,150),randInt(0,50));
        } else {
            this.color = new Color(100,100,100);
            this.lifetime += 0.5;
        }
        this.size = new Vec2(randInt(5,10));
        this.rotation = randInt(0,90);
        this.rotationSpeed = randInt(-10,10);
        this.pos.subtract(this.size.clone().divide(2));
        this.vel = new Vec2(randInt(-50,50),randInt(-150,-250));
    }
    tick() {
        this.timeLived += te.dt;
        this.pos.add(this.vel.clone().multiply(te.dt));
        this.size.add(new Vec2(te.dt*5));
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
// define ball game objects
class Ball extends te.GameObject {
    constructor(pos,radius) {
        super(pos,radius);
        this.vel = new tlib.Vec2(0,0);
        this.lifetime = 30;
        this.timeLived = 0;
        this.circularHitbox = true;
        this.noGrav = false;
        this.friction = 0.8;
        this.color = new tlib.Color(0,0,255);
    }
    tick() {
        this.timeLived += te.dt;
        if (!this.noGrav) {
            const gravity = 20;
            this.vel.y += gravity*te.dt;
        }
        this.pos.add(this.vel);
        this.vel.multiply(Math.pow(this.friction,te.dt));
        this.color.a = Math.min(1,this.lifetime-this.timeLived);
        if (this.timeLived > this.lifetime) {
            this.destroy();
        }
        // collision
        te.objects.filter(obj => obj instanceof Ball && obj !== this && this.collidesWith(obj)).forEach(obj => {
            this.handleCollision(obj);
        });
    }
    handleCollision(obj) { //https://stackoverflow.com/questions/60727534/balls-bouncing-off-of-each-other
        this.timeLived = 0;
        obj.timeLived = 0;
        this.vel = new tlib.Vec2();
        this.obj = new tlib.Vec2();
        const thisCenter = this.pos.clone().subtract(this.size.clone().divide(2));
        const objCenter = obj.pos.clone().subtract(obj.size.clone().divide(2));
        // delta from this to obj
        const delta = thisCenter.clone().subtract(objCenter);
        // magnitude of delta
        const magnitude = delta.magnitude();
        this.pos.add(delta.clone().normalize().multiply((this.radius+obj.radius)/2));
        //obj.pos.subtract(edgeVector.clone().divide(2));
        //const delta = obj.pos.clone().subtract(this.pos);
        //const distance = delta.magnitude();
        //const normal = delta.clone().normalize();
        //const relativeVelocity = obj.vel.clone().subtract(this.vel);
        //const dotProduct = relativeVelocity.dot(normal);
        //const impulseScalar = -(1 + restitution) * dotProduct / (1/thisMass + 1/objMass);
        //const impulse = normal.clone().multiply(impulseScalar);
        //this.vel.subtract(impulse.clone().multiply(1/thisMass));
        //obj.vel.add(impulse.clone().multiply(1/objMass));
    }
    draw() {
        let ctx = te.ctx;
        // draw side
        const pos = this.pos.clone().add(new tlib.Vec2(-2.5,5));
        ctx.beginPath();
        ctx.arc(pos.x+this.radius,pos.y+this.radius,this.radius,0,2*Math.PI);
        ctx.fillStyle = new tlib.Color(0,0,0,this.color.a/2);
        ctx.fill();
        // draw main
        ctx.beginPath();
        ctx.arc(this.pos.x+this.radius,this.pos.y+this.radius,this.radius,0,2*Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}
class FloatyBall extends Ball {
    constructor(pos,radius) {
        super(pos,radius);
        this.noGrav = true;
        this.color = new tlib.Color(0,200,0);
    }
}

function spawnBall(floaty) {
    const size = 25;
    const center = te.getGamePos(te.mousePos).subtract(new tlib.Vec2(size/2));
    if (!floaty) {
        te.spawn(new Ball(center,size));
    } else {
        te.spawn(new FloatyBall(center,size));
    }
    te.lastSpawned.vel.add(te.vars.avgMouseVel.clone().multiply(1/te.zoom).power(0.5));
}

te.onKeyPress = function(key, relatedInputs) {
    // toggle hitboxes if any hitboxes keybind pressed
    if (relatedInputs.includes('toggleHitboxes')) {
        te.showHitboxes = !te.showHitboxes;
    }
    // toggle game paused
    if (relatedInputs.includes('pause')) {
        te.pauseTicking = !te.pauseTicking;
    }
    // spawn balls
    if (relatedInputs.includes('spawnBall')) {
        spawnBall();
    }
    if (relatedInputs.includes('spawnFloatyBall')) {
        spawnBall(true);
    }
}
te.onMouseClick = function(pos) {
    te.vars.dragStart = pos.clone();
}
te.onMouseMove = function(pos) {
    if (te.mouseDown) {
        let delta = pos.clone().subtract(te.vars.dragStart);
        te.vars.cam.subtract(delta);
        te.vars.dragStart = pos.clone();
    }
}
te.onScroll = function(pos,delta) {
    zoom(delta.y*-0.01*te.zoom,te.mousePos);
}

// TODO fix zooming
function zoom(amount,pos) {

    //const beforeZoom = te.zoom;
    let targetZoom = te.zoom + amount;
    targetZoom = Math.min(4, Math.max(0.1, targetZoom));
    //const beforePos = pos;
    //const beforePosScreen = te.getScreenPos(pos);
    te.zoom = targetZoom;
    //const posDelta = te.getGamePos(te.mousePos).clone().subtract(beforePos);
    //const zoomDelta = te.zoom - beforeZoom;
    //const correctionX = (beforePosScreen.x / targetZoom - beforePosScreen.x / beforeZoom + beforePos.x * targetZoom) / targetZoom - te.scroll.x;
    //const correctionY = (beforePosScreen.y / targetZoom - beforePosScreen.y / beforeZoom + beforePos.y * targetZoom) / targetZoom - te.scroll.y;
    //te.scroll.x += correctionX;
    //te.scroll.y += correctionY;
    //te.vars.cam.x += correctionX;
    //te.vars.cam.y += correctionY;

    //te.zoom = tween(te.zoom, te.vars.zoom, Math.min(1, 10 * te.dt));
    //te.scroll.add(scrollCorrection);
    //te.vars.cam.add(scrollCorrection);

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
    te.keybinds.Space = 'spawnBall';
    te.keybinds.KeyK = 'spawnFloatyBall';

    // setup custom vars
    te.vars.cam = new Vec2();
    te.vars.zoom = 1;
    te.vars.mouseTrailTimer = 0;
    te.vars.mouseTrailCost = 1/60;
    te.vars.avgMouseVelArray = [];
    te.vars.avgMouseVel = new tlib.Vec2();
    
    // start game using canvas with id 'gameCanvas' in the html
    te.start('gameCanvas');

    // spawn some game objects
    te.spawn(new FloatyBall(new tlib.Vec2(-25,-25),25));
}

te.update = function(dt) {
    // update avg mouse velocity
    const currentTime = performance.now()/1000;
    te.vars.avgMouseVelArray.push({ vel:te.mouseVel, time:currentTime });
    te.vars.avgMouseVelArray = te.vars.avgMouseVelArray.filter(
      (data) => currentTime-data.time <= 0.1
    );
    // find average
    let sum = new tlib.Vec2;
    for (const item of te.vars.avgMouseVelArray) {
        sum.add(item.vel);
    }
    te.vars.avgMouseVel = sum.divide(te.vars.avgMouseVelArray.length);
    // debug text
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
    te.debugText.push(`mouseVel: ${te.vars.avgMouseVel.x.toFixed()},${te.vars.avgMouseVel.y.toFixed()}`);
    te.debugText.push(`objects: ${te.objects.length}`);

    // zooming
    let zoomAmount = 1.5 * te.zoom * te.dt;
    if (te.inputs.modifier) zoomAmount *= 2;
    if (te.inputs.zoomin) zoom(zoomAmount,te.mousePos);
    if (te.inputs.zoomout) zoom(-zoomAmount,te.mousePos);

    // scrolling
    let scrollDelta = 750 * te.zoom * te.dt;
    if (te.inputs.modifier) { scrollDelta *= 2.5; }
    scrollDelta *= 1/(0.5+Math.log2(1+te.zoom));
    if (te.inputs.left) { te.vars.cam.x -= scrollDelta; }
    if (te.inputs.right) { te.vars.cam.x += scrollDelta; }
    if (te.inputs.up) { te.vars.cam.y -= scrollDelta; }
    if (te.inputs.down) { te.vars.cam.y += scrollDelta; }
    te.scroll.x = tween(te.scroll.x, te.vars.cam.x, Math.min(1,10*te.dt));
    te.scroll.y = tween(te.scroll.y, te.vars.cam.y, Math.min(1,10*te.dt));

    // update mouse trail
    if (te.mouseHere && !te.pauseTicking) {
        te.vars.mouseTrailTimer += te.dt;
        for (let i = 0; i < Math.floor(te.vars.mouseTrailTimer/te.vars.mouseTrailCost); i++) {
            te.objects.push(new MouseTrailParticle(te.getGamePos(te.mousePos)));
            te.vars.mouseTrailTimer -= te.vars.mouseTrailCost;
        }
    }

    // drawing

    // draw background grid
    this.ctx.fillStyle = "#202030";
    drawGrid(te.getGamePos(new Vec2(0)).multiply(-te.dpr*te.zoom), 50*te.zoom*te.dpr, 3*te.zoom*te.dpr);
}

function drawGrid(offset, gridSize, gridThickness) {
    let canvas = te.canvas;
    let ctx = te.ctx;
    offset.x = ((offset.x % gridSize) + gridSize) % gridSize;
    offset.y = ((offset.y % gridSize) + gridSize) % gridSize;
    for (let x = offset.x; x < canvas.width; x += gridSize) {
        ctx.fillRect(x-gridThickness/2, 0, gridThickness, canvas.height);
    }
    for (let y = offset.y; y < canvas.height; y += gridSize) {
        ctx.fillRect(0, y-gridThickness/2, canvas.width, gridThickness);
    }
}
