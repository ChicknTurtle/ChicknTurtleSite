
import { checkBoxCollision, getPan } from "./utils.js";
import { Game } from "./gameCore.js";
import { getScreenPos } from "./utils.js";

export class GameObject {
    constructor(x=0, y=0, width=0, height=0) {
        this.id = Game.createdGameObjects;
        Game.createdGameObjects += 1;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        Game.objects.push(this);
    }
    /** Get position of the game object in the world */
    getPos() {
        return { x: this.x, y: this.y };
    }
    /** Get position of the game object on the screen */
    getScreenPos() {
        return getScreenPos(this.x, this.y);
    }
    /** Destroy this game object */
    destroy() {
        // delete objects with this id
        Game.objects = Game.objects.filter(object => object.id === this.id);
    }
    tick() {
    }
    draw() {
    }
    drawHitbox(color='red', thickness=1) {
        let ctx = Game.canvas.context;
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        let pos = getScreenPos(this.x, this.y)
        ctx.strokeRect(pos.x, pos.y, this.width, this.height);
    }
}

export class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 13, 11);
        this.gravity = 375;
        this.moveSpeed = 7.5;
        this.grounded = false;
        this.jumpCharge = 0;
        this.minJumpStrength = 75;
        this.maxJumpStrength = 300;
        this.goodJumpIncrease = 18.75;
        this.superJumpIncrease = 31.25;
        this.goodJumpTime = 0.33;
        this.superJumpTime = 0.75;
        this.maxJumpTime = 1.00;
    }
    moveWithCollision(dx, dy) {
        const groundedLastFrame = this.grounded;
        this.grounded = false;
        let hasPlayedLandSound = false;
        this.x += dx;
        this.y += dy;
        const sortedPlatforms = [...Game.platforms].sort((a, b) => a.y - b.y);
        for (let platform of sortedPlatforms) {
            platform.occupants = [];
            if (true || dy + platform.vy*Game.dt + 1 >= 0) {
                let checkBox = {x:this.x,y:this.y+1,width:this.width,height:this.height}
                if (checkBoxCollision(platform, checkBox)) {
                    this.y = platform.y - this.height;
                    this.grounded = true;
                    platform.occupants.push(this);
                    platform.vx += this.vx;
                    platform.vy += this.vy;
                    // snap to surface
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    if (!groundedLastFrame && !hasPlayedLandSound) {
                        hasPlayedLandSound = true;
                        let vol = Math.min(1, Math.max(0.5, this.vy / 250));
                        Game.sounds.landOnPlatform.play(vol, getPan(this) / 2);
                    }
                }
            }
        }
    }
    tick() {
        // left-right movement
        if (!this.grounded) {
            this.jumpCharge = 0;
            let moveMultiplier = Math.min(1, 1 - 0.75 * Math.min(this.vy / 250, 1));
            if (Game.inputs.right && !Game.inputs.left) {
                this.vx += this.moveSpeed * moveMultiplier;
            }
            if (Game.inputs.left && !Game.inputs.right) {
                this.vx -= this.moveSpeed * moveMultiplier;
            }
        } else {
            // jump charge
            if (Game.inputs.jump) {
                this.jumpCharge += Game.dt;
            } else {
                // jump
                if (this.jumpCharge > 0) {
                    this.grounded = false;
                    let jumpStrength = Math.min(this.jumpCharge / this.maxJumpTime, 1);
                    jumpStrength = this.minJumpStrength + jumpStrength * (this.maxJumpStrength - this.minJumpStrength)
                    if (this.jumpCharge >= this.goodJumpTime) {
                        jumpStrength += this.goodJumpIncrease;
                    }
                    if (this.jumpCharge >= this.superJumpTime) {
                        jumpStrength += this.superJumpIncrease;
                        //Game.sounds.superJump.play();
                    } else {
                        //Game.sounds.smallJump.play();
                    }
                    this.vy = Math.min(0, this.vy);
                    this.vy += -jumpStrength;
                }
            }
        }
        // move player
        this.vy += this.gravity*Game.dt;
        if (this.grounded) {
            this.vx = this.vx * Math.pow(0.00001, Game.dt);
        } else {
            this.vx = this.vx * Math.pow(0.1, Game.dt);
        }
    }
    draw() {
        let pos = getScreenPos(this.x, this.y);
        let sheet = Game.spritesheets.frog;
        let frame = 0;
        if (this.grounded) {
            if (this.jumpCharge > 0 && this.jumpCharge < this.goodJumpTime) {
                frame = 1;
            } else if (this.jumpCharge >= this.goodJumpTime && this.jumpCharge < this.superJumpTime) {
                frame = 2;
            } else if (this.jumpCharge >= this.superJumpTime) {
                frame = 2 + (Math.floor(this.jumpCharge*10 % 2));
            }
        }
        else {
            if (this.vy < -62.5) {
                frame = 4;
            } else if (this.vy < 125) {
                frame = 5;
            } else {
                frame = 6;
            }
        }
        const maxRotation = Math.PI / 16;
        let angle = Math.max(-maxRotation, Math.min(maxRotation, (this.vx / 125) * maxRotation));
        sheet.frames[frame].draw(pos, -4*Game.pixelScale, -9*Game.pixelScale, angle);
    }
}

export class Platform extends GameObject {
    // platform types
    // 0: green, 1: yellow
    constructor(x, y, platformType) {
        super(x, y, 59, 6);
        this.anchorX = x;
        this.anchorY = y;
        this.occupants = [];
        // type and sprite
        this.type = platformType;
        let spriteOffset = 0;
        this.sprite2 = (Math.random() < 0.2 ? 3 : 0) + 1;
        if (platformType == 1) {
            spriteOffset = 6;
            this.sprite2 = 7;
        }
        if (Math.random() < 0.5) {
            this.sprite1 = 0 + spriteOffset;
            this.sprite3 = 5 + spriteOffset;
        } else {
            this.sprite1 = 3 + spriteOffset;
            this.sprite3 = 2 + spriteOffset;
        }
    }
    tick() {
        // move platform
        let stiffness = 20;
        let damping = 0.98;
        if (this.type == 1) {
            stiffness = 10;
        }
        this.vx = (this.anchorX-this.x) * stiffness * Game.dt + this.vx * damping;
        this.vy = (this.anchorY-this.y) * stiffness * Game.dt + this.vy * damping;
        // yellow platforms fall
        if (this.type == 1 && this.occupants.length) {
            this.anchorY += 25*Game.dt;
            this.vy += 25*Game.dt;
        }
        this.x += this.vx*Game.dt;
        this.y += this.vy*Game.dt;
        // move occupants
        for (let i = 0; i < this.occupants.length; i++) {
            let object = this.occupants[i];
            object.moveWithCollision?.(this.vx*Game.dt, this.vy*Game.dt);
        }
    }
    draw() {
        let pos = getScreenPos(this.x, this.y);
        let sheet = Game.spritesheets.platforms;
        sheet.frames[this.sprite1].draw(pos, -2, -5);
        sheet.frames[this.sprite2].draw(pos, 19, -5);
        sheet.frames[this.sprite3].draw(pos, 40, -5);
    }
}
