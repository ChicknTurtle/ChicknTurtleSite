
import { Vec2 } from "./lib.js"
import { Game } from "./game.js"
import { World } from "./world/world.js"
import { WorldUtils } from "./world/utils.js"

export class PlayerObject {
  constructor(pos=new Vec2()) {
    this.pos = pos;
    this.vel = new Vec2(0,0);
    this.size = new Vec2(9,18);

    this.standingSize = new Vec2(9,18);
    this.crouchingSize = new Vec2(9,14);

    this.gravity = 800;
    this.fallGravity = 1200;

    this.moveSpeed = 1400;
    this.moveSpeedCrouching = 1200;
    this.maxMoveSpeed = 200;

    this.jumpStrength = 285;
    this.maxJumpStrength = 330;

    this.friction = 7.5;
    this.airFriction = 2.5;
    this.crouchFriction = 22;

    this.pushFactor = 0.25;
    this.brakeFactor = 2.0;
    this.airControl = 1.0;

    this.groundIdleFriction = 12;
    this.groundMoveFriction = 3;
    this.groundBrakeFriction = 25;

    this.jumpBufferTime = 0.1;
    this.coyoteTime = 0.08;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.jumpHeld = false;
    this.jumpCutApplied = false;
    this.variableJumpCut = 0.5;

    this.onGround = true;
    this.facing = 1;
    this.crouching = false;
    this.walking = false;

    this.spriteSize = 24;
    this.spriteFeetOffset = 0;
    this.spriteAnchorX = 14;
    this.cameraVerticalOffset = 10;

    this.runFPS = 8;
    this.runFrames = 4;
    this.runTime = 0;
    this.runFrame = 0;
  }

  update(dt) {
    // gravity
    this.vel.y += (this.vel.y < 0 ? this.gravity : this.fallGravity) * dt;

    // crouching & size
    const oldBottom = this.pos.y + this.size.y;
    if (this.onGround && Game.keybinds['crouch']) {
      this.crouching = true;
      this.size = this.crouchingSize.clone();
      this.pos.y = oldBottom - this.size.y;
    } else {
      const trySize = this.standingSize.clone();
      const tryPosY = oldBottom - trySize.y;
      this.size = trySize;
      this.pos.y = tryPosY;
      if (this._checkCollisionTiles()) {
        this.size = this.crouchingSize.clone();
        this.pos.y = oldBottom - this.size.y;
        this.crouching = true;
      } else {
        this.crouching = false;
      }
    }

    // jump buffering
    if (Game.keybindsClicked['jump']) this.jumpBufferTimer = this.jumpBufferTime;
    this.jumpHeld = !!Game.keybinds['jump'];
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

    // coyote time
    if (this.onGround) {
      this.coyoteTimer = this.coyoteTime;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    // movement
    let inputDir = 0;
    if (Game.keybinds['moveLeft']) inputDir -= 1;
    if (Game.keybinds['moveRight']) inputDir += 1;
    this.walking = (inputDir !== 0);
    const baseAccel = this.crouching ? this.moveSpeedCrouching : this.moveSpeed;
    const accel = baseAccel * (this.onGround ? 1 : this.airControl);
    if (inputDir !== 0) {
      const vx = this.vel.x;
      const absVx = Math.abs(vx);
      if (absVx < this.maxMoveSpeed) {
        this.vel.x += inputDir * accel * dt;
      } else {
        if (Math.sign(vx) === inputDir) {
          this.vel.x += inputDir * accel * this.pushFactor * dt;
        } else {
          this.vel.x += inputDir * accel * this.brakeFactor * dt;
        }
      }
      this.facing = inputDir > 0 ? 1 : -1;
    }

    // run animation timing
    if (this.onGround && Math.abs(this.vel.x) > 5 && !this.crouching) {
      this.runTime += dt;
      this.runFrame = Math.floor(this.runTime * this.runFPS) % this.runFrames;
    } else {
      this.runTime = 0;
      this.runFrame = -1;
    }

    // jumping
    if (this.jumpBufferTimer > 0 && (this.onGround || this.coyoteTimer > 0)) {
      const speedRatio = Math.min(Math.abs(this.vel.x), this.maxMoveSpeed) / this.maxMoveSpeed;
      const jumpVel = this.jumpStrength + (this.maxJumpStrength - this.jumpStrength) * speedRatio;
      this.vel.y = -jumpVel;
      this.onGround = false;
      this.jumpBufferTimer = 0;
      this.jumpHeld = true;
      this.jumpCutApplied = false;
    }

    // variable jump height
    if (!this.jumpHeld && this.vel.y < 0 && !this.jumpCutApplied) {
      this.vel.y *= this.variableJumpCut;
      this.jumpCutApplied = true;
    }

    // friction
    let fric = this.airFriction;
    if (this.onGround) {
      if (this.crouching) {
        fric = this.crouchFriction;
      } else if (!this.walking) {
        fric = this.groundIdleFriction;
      } else {
        const vxSign = Math.sign(this.vel.x) || 0;
        if (inputDir !== 0 && vxSign !== 0 && inputDir !== vxSign) {
          fric = this.groundBrakeFriction;
        } else {
          fric = this.groundMoveFriction;
        }
      }
    }
    this.vel.x *= Math.exp(-fric * dt);

    // move player
    this.move(this.vel.times(dt));
  }

  draw(ctx) {
    // choose sprite
    const size = this.spriteSize;
    const drawPos = this.getSpriteDrawPos();

    let sprite;
    if (this.crouching) {
      sprite = new Vec2(0,1);
    } else if (!this.onGround) {
      if (this.vel.y < 50) {
        sprite = new Vec2(1,1);
      } else {
        sprite = new Vec2(2,1);
      }
    } else {
      sprite = new Vec2(this.runFrame + 1, 0);
    }

    if (this.facing == 1) {
      ctx.drawImage(Game.textures['player'], sprite.x * size, sprite.y * size, size, size, drawPos.x, drawPos.y, size, size);
    } else {
      ctx.drawImage(Game.textures['player_flipped'], sprite.x * size, sprite.y * size, size, size, drawPos.x, drawPos.y, size, size);
    }

    WorldUtils.drawHitbox(ctx, this.pos, this.size, 'red');
  }

  // bottom center of hitbox
  getFeet() {
    return new Vec2(this.pos.x + this.size.x * 0.5, this.pos.y + this.size.y);
  }

  getSpriteDrawPos() {
    const feet = this.getFeet();
    const anchorX = (this.facing === 1) ? this.spriteAnchorX : (this.spriteSize - this.spriteAnchorX);
    return new Vec2(feet.x - anchorX, feet.y - this.spriteFeetOffset - this.spriteSize);
  }

  getCameraAnchor() {
    const feet = this.getFeet();
    return new Vec2(feet.x, feet.y - this.cameraVerticalOffset);
  }

  move(delta) {
    if (!delta || delta.isZero()) return;
    const granularity = Math.max(Math.abs(this.size.x), Math.abs(this.size.y)) / 2 || 1;
    const maxDelta = Math.max(Math.abs(delta.x), Math.abs(delta.y));
    const steps = Math.max(1, Math.ceil(maxDelta / granularity));
    const step = new Vec2(delta.x / steps, delta.y / steps);
    this.onGround = false;
    for (let i = 0; i < steps; i++) {
      // horizontal collision
      if (step.x !== 0) {
        this.pos.x += step.x;
        const collisions = this._checkCollisionTiles();
        if (collisions) {
          if (step.x > 0) {
            let minTx = Infinity;
            for (const c of collisions) if (c.tx < minTx) minTx = c.tx;
            this.pos.x = (minTx * World.TILE_SIZE) - this.size.x;
          } else {
            let maxTx = -Infinity;
            for (const c of collisions) if (c.tx > maxTx) maxTx = c.tx;
            this.pos.x = (maxTx + 1) * World.TILE_SIZE;
          }
          this.vel.x = 0;
        }
      }
      // vertical collision
      if (step.y !== 0) {
        this.pos.y += step.y;
        const collisions = this._checkCollisionTiles();
        if (collisions) {
          if (step.y > 0) {
            let minTy = Infinity;
            for (const c of collisions) if (c.ty < minTy) minTy = c.ty;
            this.pos.y = (minTy * World.TILE_SIZE) - this.size.y;
            this.onGround = true;
          } else {
            let maxTy = -Infinity;
            for (const c of collisions) if (c.ty > maxTy) maxTy = c.ty;
            this.pos.y = (maxTy + 1) * World.TILE_SIZE;
          }
          this.vel.y = 0;
        }
      }
    }
  }
  
  _checkCollisionTiles() {
    const left = this.pos.x;
    const top = this.pos.y;
    const right = this.pos.x + this.size.x;
    const bottom = this.pos.y + this.size.y;

    const tileLeft = Math.floor(left / World.TILE_SIZE);
    const tileTop = Math.floor(top / World.TILE_SIZE);
    const tileRight = Math.floor((right - 1e-6) / World.TILE_SIZE);
    const tileBottom = Math.floor((bottom - 1e-6) / World.TILE_SIZE);

    const hits = [];

    for (let tx = tileLeft; tx <= tileRight; tx++) {
      for (let ty = tileTop; ty <= tileBottom; ty++) {
        const tile = World.getTileAt(new Vec2(tx, ty), World.layers.GROUND);
        if (World.tileInfo?.[tile]?.solid) hits.push({ tx, ty });
      }
    }

    return hits.length ? hits : null;
  }
}
