
import { Game } from "./gameCore.js";

/** game position > screen position */
export function getScreenPos(x, y) {
    let centerX = Math.floor(Game.canvas.canvas.clientWidth / 2);
    let centerY = Math.floor(Game.canvas.canvas.clientHeight / 2);
    return { x:x-Game.currentScrollX+centerX, y:y-Game.currentScrollY+centerY };
}
/** screen position > game position */
export function getGamePos(x, y) {
    let centerX = Math.floor(Game.canvas.canvas.clientWidth / 2);
    let centerY = Math.floor(Game.canvas.canvas.clientHeight / 2);
    return { x:x+Game.currentScrollX-centerX, y:y+Game.currentScrollY-centerY };
}

export function translateSnapped(ctx, x, y) {
    const dpr = window.devicePixelRatio || 1;
    const screenX = x * Game.zoom * dpr;
    const screenY = y * Game.zoom * dpr;
    const snappedX = Math.round(screenX) / (Game.zoom * dpr);
    const snappedY = Math.round(screenY) / (Game.zoom * dpr);
    ctx.translate(snappedX, snappedY);
}

/** check collision between two hitboxes */
export function checkBoxCollision(box1, box2) {
    return (
        box1.x <= box2.x + box2.width &&
        box1.x + box1.width >= box2.x &&
        box1.y <= box2.y + box2.height &&
        box1.y + box1.height >= box2.y
    );
}

/** get sound pan value of an object in relation to the screen */
export function getPan(object) {
    let pos = getScreenPos(object.x, object.y);
    let centerX = Math.floor(Game.canvas.canvas.clientWidth / 2);
    let pan = (pos.x+object.width/2 - centerX) / centerX;
    return Math.min(1, Math.max(-1, pan));
}

/** get whether platform is estimated to be MacOS */
export function isMacOS() {
    if (navigator.userAgentData && navigator.userAgentData.platform) {
        return navigator.userAgentData.platform.toLowerCase().includes('mac');
    }
    return navigator.userAgent.toLowerCase().includes('mac');
}
