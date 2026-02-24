
// TODO
// fix movement / friction
// variable jump height
// jump buffering
// coyote time

class PlayerObject {
  constructor(pos=new Vec2()) {
    this.pos = pos;
    this.vel = new Vec2(0,0);
    this.size = new Vec2(9,14);
    this.gravity = 600;
    this.fallGravity = 800;
    this.moveSpeed = 2000;
    this.moveSpeedCrouching = 200;
    this.jumpStrength = 260;
    this.friction = 15;
    this.airFriction = 10;
    this.onGround = false;
    this.facing = 'right';
    this.crouching = false;
    this.runFPS = 8;
    this.runFrames = 3;
    this.runTime = 0;
    this.runFrame = 0;
  }

  update(dt) {
    this.vel.y += (this.vel.y < 0 ? this.gravity : this.fallGravity) * dt;

    // crouching
    if (this.onGround && Game.keybinds['crouch']) {
      this.crouching = true;
    } else {
      this.crouching = false;
    }
    
    // movement
    if (Game.keybinds['moveLeft'] || Game.keybinds['moveRight']) {
      if (Game.keybinds['moveLeft']) {
        this.vel.x -= (this.crouching ? this.moveSpeedCrouching : this.moveSpeed)*dt;
        this.facing = 'left';
      }
      if (Game.keybinds['moveRight']) {
        this.vel.x += (this.crouching ? this.moveSpeedCrouching : this.moveSpeed)*dt;
        this.facing = 'right';
      }
    }

    // run animation
    if (this.onGround && Math.abs(this.vel.x) > 5 && !this.crouching) {
      this.runTime += dt;
      this.runFrame = Math.floor(this.runTime * this.runFPS) % this.runFrames;
    } else {
      this.runTime = 0;
      this.runFrame = -1;
    }

    // jumping
    if (this.onGround && !this.crouching && Game.keybindsClicked['jump']) {
      this.vel.y -= this.jumpStrength;
    }

    // friction
    this.vel.x *= (Math.exp(-(this.onGround ? this.friction : this.airFriction) * dt));;

    // move player
    this.move(this.vel.times(dt));
  }

  draw(ctx) {
    // choose sprite
    let sprite;
    if (this.crouching) {
      sprite = new Vec2(0,24);
    } else {
      sprite = new Vec2(this.runFrame*24+24,0);
    }
    // draw sprite facing correct way
    if (this.facing == 'right') {
      ctx.drawImage(Game.textures['player'], sprite.x,sprite.y, 24,24, this.pos.x-9,this.pos.y-10, 24,24)
    } else {
      ctx.drawImage(Game.textures['player_flipped'], sprite.x,sprite.y, 24,24, this.pos.x-6,this.pos.y-10, 24,24)
    }
    World.drawHitbox(ctx, this.pos, this.size, 'red');
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
