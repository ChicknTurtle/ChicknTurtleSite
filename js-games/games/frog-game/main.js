/*jshint esversion: 6 */

import { setupGame, loadAssets } from "./setup.js";
import { Game } from "./gameCore.js";
import { Player } from "./gameObjects.js";

function start() {
    console.log("Loading game resources...");
    // wait for setup before starting game
    setupGame();
    loadAssets(() => {
        console.log("Starting game...");
        Game.canvas.start();
        Game.player = new Player(0, -100);
        requestAnimationFrame(update);
    });
}

function update(timestamp) {
    requestAnimationFrame(update);
    // update data for this frame
    Game.dt = timestamp/1000 - Game.lastTimestamp/1000;
    Game.dt = Math.min(Game.dt, 1/10);
    Game.fps = 1/Game.dt;
    Game.time += Game.dt;
    Game.lastTimestamp = timestamp;

    // pause
    if (!Game.paused || Game.stepOneFrame) {
        Game.tick();
    }
    Game.stepOneFrame = false;
    Game.draw();
}

window.addEventListener("load", start);
