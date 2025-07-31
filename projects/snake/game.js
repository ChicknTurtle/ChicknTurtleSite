
var game = {
    // internal
    lastTimestamp: 0,
    /** @type {HTMLCanvasElement} */
    canvas: null,
    /** @type {CanvasRenderingContext2D} */
    ctx: CanvasRenderingContext2D,
    dt: 0,
    fps: 0,
    // game constants
    CANVAS_WIDTH: 480,
    CANVAS_HEIGHT: 270,
    GRID_WIDTH: 32,
    GRID_HEIGHT: 18,
    GRID_SCALE: 10,
    GRID_GAP: 1,
    BG_COLOR: 'rgb(0,0,0)',
    ACCENT_COLOR: 'rgb(255,255,255)',
    SNAKE_COLOR: 'rgb(0,255,0)',
    FOOD_COLOR: 'rgb(255,0,0)',
    START_SNAKE_LEN: 3,
    START_TICK_TIME: 0.2,
    TICK_TIME_DECREASE: 0.005,
    MIN_TICK_TIME: 0.05,
    // game vars
    gameTime: 0,
    tickTimer: 0,
    noTick: false,
    currentTickTime: 0,
    score: 0,
    snake: [],
    food: [],
    nextDir: null,
    nextNextDir: null,
    snakeDir: 1,
};

async function loadAssets() {
    const font = new FontFace('8-bit-hud', 'url(assets/8-bit-hud.ttf)');
    await font.load();
    document.fonts.add(font);
}

async function init() {
    // setup scene
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    game.canvas.width = game.CANVAS_WIDTH;
    game.canvas.height = game.CANVAS_HEIGHT;
    await Promise.all([
        document.fonts.ready,
        loadAssets(),
    ]);
    // setup game
    const midX = Math.floor(game.GRID_WIDTH/2-1);
    const midY = Math.floor(game.GRID_HEIGHT/2-1);
    for (let i = 0; i < game.START_SNAKE_LEN; i++) {
        game.snake.push([midX-i,midY]);
    }
    game.currentTickTime = game.START_TICK_TIME;
    spawnFood();
    requestAnimationFrame(update);
}

document.addEventListener('keydown', function(event) {
    let preventKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];
    if (preventKeys.includes(event.code)) {
        event.preventDefault();
    }
    let newDir = null;
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        newDir = 3;
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        newDir = 1;
    } else if (event.code === 'ArrowUp' || event.code === 'KeyW') {
        newDir = 0;
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        newDir = 2;
    } else {
        return;
    }
    const currentDir = (game.nextDir === null) ? game.snakeDir : game.nextDir;
    if ((currentDir ^ 2) === newDir) {
        return;
    }
    if (game.nextDir === null) {
        game.nextDir = newDir;
        return;
    }
    if (game.nextNextDir === null) {
        game.nextNextDir = newDir;
        return;
    }
    const axisOfNextDir = game.nextDir % 2, axisOfOldNextNext = game.nextNextDir % 2, axisOfCandidate = newDir % 2;
    const oldWasStraight = axisOfNextDir === axisOfOldNextNext, candidateIsTurn = axisOfCandidate !== axisOfNextDir;
    if (oldWasStraight && candidateIsTurn) game.nextNextDir = newDir;
});

function update(timestamp) {
    requestAnimationFrame(update);
    game.dt = (timestamp - game.lastTimestamp)/1000;
    game.fps = 1/game.dt;
    game.lastTimestamp = timestamp;
    // game logic
    game.tickTimer += game.dt;
    if (!game.noTick) {
        game.gameTime += game.dt;
        if (game.tickTimer > game.currentTickTime) {
            game.tickTimer = 0;
            gameTick();
        }
    }
    // draw game
    draw();
}

function spawnFood() {
    if (game.snake.length >= game.GRID_WIDTH*game.GRID_HEIGHT) {
        return;
    }
    let randX, randY;
    let valid = true;
    while (valid) {
        randX = Math.floor(Math.random() * game.GRID_WIDTH);
        randY = Math.floor(Math.random() * game.GRID_HEIGHT);
        valid = false;
        for (let i = 0; i < game.snake.length; i++) {
            let segment = game.snake[i];
            if (segment[0] === randX && segment[1] === randY) {
                valid = true;
                break;
            }
        }
    }
    game.food.push([randX, randY]);
}

function gameTick() {
    // move snake
    if (game.nextDir !== null) {
        game.snakeDir = game.nextDir;
    }
    game.nextDir = game.nextNextDir;
    game.nextNextDir = null;
    const head = game.snake[0];
    let newHead = [];
    if (game.snakeDir === 0) {
        newHead = [head[0],head[1]-1];
    } else if (game.snakeDir === 1) {
        newHead = [head[0]+1,head[1]];
    } else if (game.snakeDir === 2) {
        newHead = [head[0],head[1]+1];
    } else if (game.snakeDir === 3) {
        newHead = [head[0]-1,head[1]];
    }
    // screen wrap
    newHead[0] = (newHead[0] + game.GRID_WIDTH) % game.GRID_WIDTH;
    newHead[1] = (newHead[1] + game.GRID_HEIGHT) % game.GRID_HEIGHT;
    // check snake collide self
    for (let i = 1; i < game.snake.length-1; i++) {
        if (newHead[0] === game.snake[i][0] && newHead[1] === game.snake[i][1]) {
            game.snake = [];
            game.noTick = true;
        }
    }
    // check snake collide food
    let ateFood = false;
    for (let i = 0; i < game.food.length; i++) {
        if (newHead[0] === game.food[i][0] && newHead[1] === game.food[i][1]) {
            game.food.splice(i,1);
            ateFood = true;
            game.score += 1;
            game.currentTickTime = Math.max(game.MIN_TICK_TIME,game.currentTickTime-game.TICK_TIME_DECREASE);
            spawnFood();
        }
    }
    // add new head
    game.snake.unshift(newHead);
    // shrink tail if didn't eat
    if (!ateFood) {
        game.snake.pop();
    }
}

function draw() {
    // setup frame
    const ctx = game.ctx;
    ctx.imageSmoothingEnabled = false;
    const canvasCenterX = game.CANVAS_WIDTH/2;
    const canvasCenterY = game.CANVAS_HEIGHT/2;
    ctx.fillStyle = game.BG_COLOR;
    ctx.clearRect(0,0,game.CANVAS_WIDTH,game.CANVAS_HEIGHT);
    ctx.fillRect(0,0,game.CANVAS_WIDTH,game.CANVAS_HEIGHT);
    // draw objects
    const totalGridWidth = game.GRID_WIDTH*game.GRID_SCALE+((game.GRID_WIDTH-1)*game.GRID_GAP);
    const totalGridHeight = game.GRID_HEIGHT*game.GRID_SCALE+((game.GRID_HEIGHT-1)*game.GRID_GAP);
    const offsetX = Math.floor(canvasCenterX-totalGridWidth/2);
    const offsetY = Math.floor(canvasCenterY-totalGridHeight/2);
    // food
    ctx.fillStyle = game.FOOD_COLOR;
    for (let i = 0; i < game.food.length; i++) {
        const food = game.food[i];
        const x = food[0]*(game.GRID_SCALE+game.GRID_GAP);
        const y = food[1]*(game.GRID_SCALE+game.GRID_GAP);
        ctx.fillRect(x+offsetX,y+offsetY,game.GRID_SCALE,game.GRID_SCALE);
    }
    // snake
    ctx.fillStyle = game.SNAKE_COLOR;
    for (let i = 0; i < game.snake.length; i++) {
        const segment = game.snake[i];
        const x = segment[0]*(game.GRID_SCALE+game.GRID_GAP);
        const y = segment[1]*(game.GRID_SCALE+game.GRID_GAP);
        ctx.fillRect(x+offsetX,y+offsetY,game.GRID_SCALE,game.GRID_SCALE);
    }
    // draw ui
    ctx.fillStyle = game.ACCENT_COLOR;
    // border
    ctx.fillRect(offsetX-2,offsetY-2,totalGridWidth+4,1);
    ctx.fillRect(offsetX-2,offsetY-2,1,totalGridHeight+4);
    ctx.fillRect(offsetX-2,offsetY+totalGridHeight+1,totalGridWidth+4,1);
    ctx.fillRect(offsetX+totalGridWidth+1,offsetY-2,1,totalGridHeight+4);
    // score
    ctx.textRendering = 'geometricPrecision';
    ctx.textBaseline = 'top';
    ctx.font = "5px '8-bit-hud'";
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${game.score}  Time: ${Math.floor(game.gameTime)}`, offsetX-1,offsetY-8);
    ctx.textAlign = 'right';
    ctx.fillText(`${game.nextDir || game.snakeDir}`, offsetX+totalGridWidth,offsetY-8);
}
