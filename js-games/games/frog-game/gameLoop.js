
import { Game } from "./gameCore.js";
import { Platform } from "./gameObjects.js";

// game loop

export function gameLoop() {
    // spawn platforms
    while (Game.scrollY - 500 < Game.nextPlatformY - Game.platformVerticalSpacing) {
        Game.nextPlatformY -= Game.platformVerticalSpacing;
        let platformX;
        let requiredSeparation = Game.platformHorizontalSpacing;
        do {
            platformX = Math.random() * 250 - 125;
            requiredSeparation -= 5;
        } while (Math.abs(platformX - Game.lastPlatformX) < requiredSeparation);
        let platformType = Math.random() < 0.5 ? 0 : 1;
        if (Game.lastPlatformType == 1 || Game.nextPlatformY >= 0) {
            platformType = 0;
        }
        Game.lastPlatformType = platformType;
        let platform = new Platform(platformX, Game.nextPlatformY, platformType);
        platform.x -= platform.width / 2;
        platform.anchorX = platform.x;
        Game.lastPlatformX = platform.x;
        Game.platforms.push(platform);
        // spawn player on platform
        if (platform.y >= 0) {
            player.x = platformX - player.width/2;
            player.y = platform.y - player.height*2;
            player.grounded = true;
            player.vy = 0;
        }
    }
    // player logic
    let player = Game.player;
    player.tick();
    player.moveWithCollision(player.vx * Game.dt, player.vy * Game.dt);
    // scroll screen
    if (player.y < Game.maxScrollY) {
        Game.maxScrollY = player.y;
    }
    Game.scrollY = Math.min(player.y, Game.maxScrollY + 250);
    Game.currentScrollX += (Game.scrollX - Game.currentScrollX)*Game.dt * 5;
    Game.currentScrollY += (Game.scrollY - Game.currentScrollY)*Game.dt * 5;
    // tick platforms
    for (let platform of Game.platforms) {
        platform.tick();
    }
    // remove platforms under the screen
    let cullY = Game.scrollY + 375;
    let removedPlatforms = Game.platforms.filter(p => p.y >= cullY);
    Game.platforms = Game.platforms.filter(obj => !removedPlatforms.includes(obj));
    Game.objects = Game.objects.filter(obj => !removedPlatforms.includes(obj));
}

// draw game

export function drawGame() {
    let canvas = Game.canvas;
    let ctx = canvas.context;
    canvas.clear();

    // setup zoom
    ctx.save();
    const centerX = canvas.canvas.clientWidth/2;
    const centerY = canvas.canvas.clientHeight/2;
    ctx.translate(centerX, centerY);
    ctx.scale(Game.zoom, Game.zoom);
    ctx.translate(-centerX, -centerY);

    ctx.imageSmoothingEnabled = true;
    // draw background
    Game.setBgColor("rgb(200, 255, 200)");
    // draw player
    Game.player.draw();
    // draw platforms
    for (let i = 0; i < Game.platforms.length; i++) {
        Game.platforms[i].draw();
    }
    // draw hitboxes
    if (Game.showhitboxes) {
        for (let i = 0; i < Game.objects.length; i++) {
            Game.objects[i].drawHitbox('red', 0.5);
        }
    }

    ctx.restore();

    // draw ui
    // debug display
    let lines = [];
    lines.push(`fps: ${Game.fps.toFixed(1)} dt: ${Game.dt.toFixed(5)}`);
    lines.push(`mx: ${Game.mousePos.x.toFixed(2)} my: ${Game.mousePos.y.toFixed(2)}`);
    lines.push(`x: ${Game.player.x.toFixed(2)} y: ${Game.player.y.toFixed(2)}`);
    lines.push(`vx: ${Game.player.vx.toFixed(2)} vy: ${Game.player.vy.toFixed(2)}`);
    lines.push(`sy: ${Game.scrollY.toFixed(2)} max: ${Game.maxScrollY.toFixed(2)}`);
    lines.push(`grounded: ${Game.player.grounded}`);
    if (Game.debugtext !== "") {
        lines.push(`DEBUG: ${Game.debugtext}`);
    }
    ctx.imageSmoothingEnabled = false;
    ctx.font = '16px Courier New';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    for (let i = 0; i < lines.length; i++) {
        ctx.strokeText(lines[i], 12, i*20+30.5);
        ctx.fillText(lines[i], 12, i*20+30);
    }
}
