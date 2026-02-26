import { Vec2 } from "./lib.js"
import { Game } from "./game.js"
import { World } from "./world/world.js"
import { WorldUtils } from "./world/utils.js"

export class PlayerObject {
  constructor(pos=new Vec2()) {
    this.pos = pos;
    this.vel = new Vec2(0,0);
    this.size = new Vec2(10,14);

    this.standingSize = new Vec2(10,14);
    this.crouchingSize = new Vec2(10,14);

    this.gravity = 650;
    this.fallGravity = 1200;

    this.moveSpeed = 400;
    this.maxMoveSpeed = 180;

    this.minJumpHeight = 52;
    this.maxJumpHeight = 68;

    this.friction = 7.5;
    this.airFriction = 2.5;
    this.fallFriction = 1.0;

    this.moveSpeedCrouching = 300;
    this.maxMoveSpeedCrouching = 35;
    this.crouchFriction = 12;

    this.airTurning = 1.5;
    this.airControl = 1.25;

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

    this.jumpSpeedMinBuffer = 0.2;
    this.jumpSpeedMaxBuffer = 0.8;
    this.jumpMinFraction = 0.1;

    // internals
    this.lastJumpVel = 0;

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
    const maxMoveSpeed = this.crouching ? this.maxMoveSpeedCrouching : this.maxMoveSpeed;

    const vx = this.vel.x;

    if (inputDir !== 0) {
      // same direction as current velocity / standing still
      if (Math.sign(vx) === inputDir || vx === 0) {
        const appliedAccel = accel;
        const preAbs = Math.abs(this.vel.x);

        this.vel.x += inputDir * appliedAccel * dt;

        if (preAbs <= maxMoveSpeed && Math.abs(this.vel.x) > maxMoveSpeed) {
          this.vel.x = Math.sign(this.vel.x) * maxMoveSpeed;
        }
      } else {
        // braking
        if (this.onGround) {
          this.vel.x += inputDir * accel * dt;
        } else {
          this.vel.x += inputDir * accel * this.airTurning * dt;
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

    // jumping — now height-based
    if (this.jumpBufferTimer > 0 && (this.onGround || this.coyoteTimer > 0)) {
      // compute speed-based jump with min/max buffer (applies to height now)
      const measuredVx = Math.min(Math.abs(this.vel.x), this.maxMoveSpeed);
      const speedFraction = this.maxMoveSpeed > 0 ? (measuredVx / this.maxMoveSpeed) : 0;

      const minB = this.jumpSpeedMinBuffer;
      const maxB = this.jumpSpeedMaxBuffer;
      let ratio;
      if (speedFraction <= minB) {
        ratio = 0;
      } else if (speedFraction >= maxB) {
        ratio = 1;
      } else {
        ratio = (speedFraction - minB) / Math.max(1e-6, (maxB - minB));
      }

      // interpolate height and derive initial jump velocity from gravity
      const jumpHeight = this.minJumpHeight + (this.maxJumpHeight - this.minJumpHeight) * ratio;
      const jumpVel = Math.sqrt(Math.max(0, 2 * this.gravity * jumpHeight));
      this.vel.y = -jumpVel;
      this.lastJumpVel = jumpVel;

      this.onGround = false;
      this.jumpBufferTimer = 0;
      this.jumpHeld = true;
      this.jumpCutApplied = false;
    }

    // variable jump height
    if (!this.jumpHeld && this.vel.y < 0 && !this.jumpCutApplied) {
      const cutVel = this.vel.y * this.variableJumpCut;
      const minVel = -this.lastJumpVel * this.jumpMinFraction;
      this.vel.y = Math.min(cutVel, minVel);
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

    let applyDamping = true;
    if (!this.crouching && inputDir !== 0 && Math.sign(this.vel.x) === inputDir) {
      applyDamping = false;
    }

    if (applyDamping) {
      this.vel.x *= Math.exp(-fric * dt);
    }

    if (!this.onGround && this.vel.y > 0) {
      this.vel.y *= Math.exp(-this.fallFriction * dt);
    }

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