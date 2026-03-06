import { Vec2 } from "../utils/lib.js"
import { Game } from "../game.js"
import { EventBus } from "../core/eventBus.js"
import { PhysicsEntity } from "./physics_entity.js"
import { World } from "../world/world.js"
import { WorldUtils } from "../world/utils.js"
import { CoinEntity } from "./coins.js"

export class PlayerEntity extends PhysicsEntity {
  constructor(pos = new Vec2()) {
    super(pos);
    if (pos.divided(World.TILE_SIZE).equals(World.spawnPos)) {
      World.mainPlayer = this;
    }
    pos.add(new Vec2(3,2));
    this.originPos = pos.clone();

    // size
    this.standingSize = new Vec2(10,14);
    this.crouchingSize = new Vec2(10,14);
    this.size = this.standingSize;
    this.prevSize = this.size.clone();

    this.gravity = 650;
    this.fallGravity = 1200;

    this.moveSpeed = 400;
    this.maxMoveSpeed = 180;

    this.minJumpHeight = 68;
    this.maxJumpHeight = 88;

    this.friction = 7.5;
    this.airFriction = 2.5;
    this.fallFriction = 1.0;

    this.moveSpeedCrouching = 0;
    this.maxMoveSpeedCrouching = 20;
    this.crouchFriction = 20;

    this.airTurning = 1.5;
    this.airControl = 1.25;

    this.swipeVelocity = -120;
    this.swipeDuration = 0.2;
    this.swipeCooldown = 0.35;
    this.swipeFrames = 5;

    this.groundIdleFriction = 12;
    this.groundMoveFriction = 3;
    this.groundBrakeFriction = 25;

    this.jumpBufferTime = 0.1;
    this.coyoteTime = 0.12;
    this.variableJumpCut = 0.5;

    this.jumpSpeedMinBuffer = 0.2;
    this.jumpSpeedMaxBuffer = 0.8;
    this.jumpMinFraction = 0.1;

    this.spriteSize = 32;
    this.spriteFeetOffset = -5;
    this.spriteAnchorX = 18;
    this.cameraVerticalOffset = 10;

    this.runFPS = 8;
    this.runFrames = 4;

    this.EPS_RESOLVE = 0.01;

    // trackers
    this.swipeTime = 0;
    this.swipeCooldownTime = 0;
    this.swipedSinceGrounded = false;
    this.endedSwipeSinceGrounded = false;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.jumpHeld = false;
    this.jumpCutApplied = false;
    this.lastJumpVel = 0;
    this.onGround = false;
    this.facing = 1;
    this.crouching = false;
    this.walking = false;
    this.runTime = 0;
    this.runFrame = 0;
  }

  update(dt) {
    // gravity
    if (!this.onGround) {
      this.vel.y += (this.vel.y < 0 ? this.gravity : this.fallGravity) * dt;
    }

    // crouching & size
    const oldBottom = this.pos.y + this.size.y;
    if (this.onGround && Game.keybinds['crouch'] && this.swipeTime <= 0) {
      this.crouching = true;
      this.size = this.crouchingSize.clone();
      this.pos.y = oldBottom - this.size.y;
    } else {
      const trySize = this.standingSize.clone();
      const tryPosY = oldBottom - trySize.y;
      this.size = trySize;
      this.pos.y = tryPosY;
      this.crouching = false;
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

    // swipe
    this.swipeTime = Math.max(0, this.swipeTime - dt);
    if (this.swipeTime <= 0 && this.swipedSinceGrounded) {
      this.endedSwipeSinceGrounded = true;
    }
    this.swipeCooldownTime = Math.max(0, this.swipeCooldownTime - dt);
    if (Game.keybindsClicked['attack'] && this.swipeCooldownTime <= 0 && !this.crouching) {
      this.swipeTime = this.swipeDuration;
      this.swipeCooldownTime = this.swipeCooldown;
      if (!this.onGround && !(this.coyoteTimer > 0) && !this.swipedSinceGrounded) {
        this.swipedSinceGrounded = true;
        this.endedSwipeSinceGrounded = false;
        this.vel.y = Math.min(this.vel.y, this.swipeVelocity);
      }
    }
    if (this.swipeTime > 0 && !this.onGround && !this.endedSwipeSinceGrounded) {
      this.vel.y = Math.min(this.vel.y, 0);
    }

    // movement input
    let inputDir = 0;
    if (Game.keybinds['moveLeft']) inputDir -= 1;
    if (Game.keybinds['moveRight']) inputDir += 1;
    this.walking = (inputDir !== 0);
    const baseAccel = this.crouching ? this.moveSpeedCrouching : this.moveSpeed;
    const accel = baseAccel * (this.onGround ? 1 : this.airControl);
    const maxMoveSpeed = this.crouching ? this.maxMoveSpeedCrouching : this.maxMoveSpeed;

    const vx = this.vel.x;

    if (inputDir !== 0) {
      // forward / standing still
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

    // jumping
    if (this.jumpBufferTimer > 0 && (this.onGround || this.coyoteTimer > 0)) {
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

      const jumpHeight = this.minJumpHeight + (this.maxJumpHeight - this.minJumpHeight) * ratio;
      const jumpVel = Math.sqrt(Math.max(0, 2 * this.gravity * jumpHeight));
      this.vel.y = -jumpVel;
      this.lastJumpVel = jumpVel;

      this.onGround = false;
      this.jumpBufferTimer = 0;
      this.jumpHeld = true;
      this.jumpCutApplied = false;
      this.coyoteTimer = 0;
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

    this.moveDelta(this.vel.times(dt));

    // entity collision
    const nearby = World.queryEntitiesInAABB(
      this.pos,
      this.size
    );
    for (const e of nearby) {
      if (e === this) continue;
      // collect coin
      if (e instanceof CoinEntity) {
        World.removeEntity(e);
      // push players apart
      } else if (e instanceof PlayerEntity) {
        const dx = this.pos.x - e.pos.x;
        this.vel.x += (dx > 0 ? 1 : dx < 0 ? -1 : (Math.random() < 0.5 ? -1 : 1)) * 800 * dt;
      }
    }

    // update cam
    if (World.mainPlayer === this) {
      World.cam.pos.x = this.getCameraAnchor().x + (Game.canvas.width/Game.dpr/World.cam.zoom)/-2;
      World.cam.pos.y = this.getCameraAnchor().y + (Game.canvas.height/Game.dpr/World.cam.zoom)/-2;
      World.cam.pos.x = Math.floor(World.cam.pos.x * World.cam.zoom * Game.dpr) / World.cam.zoom / Game.dpr;
      World.cam.pos.y = Math.floor(World.cam.pos.y * World.cam.zoom * Game.dpr) / World.cam.zoom / Game.dpr;
    }
  }

  draw(ctx) {
    // choose sprite
    let sprite;
    if (this.crouching) {
      sprite = new Vec2(0,1);
    } else if (this.swipeTime > 0) {
      sprite = new Vec2(3 + Math.floor(Math.min(Math.max((this.swipeDuration - this.swipeTime) / this.swipeDuration, 0) * this.swipeFrames, this.swipeFrames - 1e-9)), 1);
    } else if (!this.onGround) {
      if (this.vel.y < 0) {
        sprite = new Vec2(1,1);
      } else {
        sprite = new Vec2(2,1);
      }
    } else {
      sprite = new Vec2(this.runFrame + 1, 0);
    }

    const size = this.spriteSize;
    const drawPos = this.getSpriteDrawPos();

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
    const pos = new Vec2(feet.x - anchorX, feet.y - this.spriteFeetOffset - this.spriteSize);
    return pos.multiply(World.cam.zoom).multiply(Game.dpr).floor().divide(World.cam.zoom).divide(Game.dpr);
  }

  getCameraAnchor() {
    const feet = this.getFeet();
    return new Vec2(feet.x, feet.y - this.cameraVerticalOffset);
  }

  kill() {
    this.pos = this.originPos.clone();
    this.vel = new Vec2();
    this.onGround = false;
    this.swipedSinceGrounded = false;
    this.endedSwipeSinceGrounded = false;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.jumpHeld = false;
    this.jumpCutApplied = false;
  }

  onTileCollision(collision) {
    if (collision.info?.damages) {
      this.kill();
    }
    if (collision.info?.goal) {
      EventBus.emit('player:reached_goal', this);
    }
  }
}