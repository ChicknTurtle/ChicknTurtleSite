import { Vec2 } from "../utils/lib.js"
import { Entity } from "./entity.js"
import { World } from "../world/world.js"

export class PhysicsEntity extends Entity {
  constructor(pos = new Vec2()) {
    super(pos);

    this.prevPos = pos.clone();
    this.prevSize = (this.size && this.size.clone) ? this.size.clone() : new Vec2();
    this.vel = this.vel ?? new Vec2();

    this.onGround = false;

    this.EPS_RESOLVE = 0.01;
    this.MAX_PHYS_ITER = 64;
    this.SUBSTEP_TILE_FRACTION = 0.1;
    this.EPS_TIE = 1e-10;

    this._prevContacts = {};
  }

  // move using swept-AABB resolution
  moveDelta(vel, dt) {
    if (!vel || !isFinite(dt) || dt <= 0) return;

    const delta = vel.clone().multiply(dt);

    this.prevPos = this.pos.clone();
    this.prevSize = this.size.clone();

    const maxDelta = Math.max(Math.abs(delta.x), Math.abs(delta.y));
    const tile = Math.max(1, World.TILE_SIZE || 16);
    const threshold = tile * this.SUBSTEP_TILE_FRACTION;
    const steps = Math.max(1, Math.ceil(maxDelta / threshold));

    const newContacts = {};

    for (let i = 0; i < steps; i++) {
      const subDelta = new Vec2(delta.x / steps, delta.y / steps);
      this._moveSwept(subDelta, newContacts);
      if (!isFinite(this.pos.x) || !isFinite(this.pos.y)) break;
    }

    this._prevContacts = newContacts;
    World.updateEntityPosition(this, this.pos);
  }

  _getTileHitbox(tx, ty, info) {
    const S = World.TILE_SIZE;
    const hb = info?.hitbox;
    if (!hb) {
      return {
        left: tx * S,
        top: ty * S,
        right: (tx + 1) * S,
        bottom: (ty + 1) * S
      };
    }
    const normalized = hb.norm !== false;
    if (normalized) {
      const x1 = (hb.x1 !== undefined ? hb.x1 : 0);
      const y1 = (hb.y1 !== undefined ? hb.y1 : 0);
      const x2 = (hb.x2 !== undefined ? hb.x2 : 1);
      const y2 = (hb.y2 !== undefined ? hb.y2 : 1);
      return {
        left: tx * S + x1 * S,
        top: ty * S + y1 * S,
        right: tx * S + x2 * S,
        bottom: ty * S + y2 * S
      };
    } else {
      const x1 = (hb.x1 !== undefined ? hb.x1 : 0);
      const y1 = (hb.y1 !== undefined ? hb.y1 : 0);
      const x2 = (hb.x2 !== undefined ? hb.x2 : S);
      const y2 = (hb.y2 !== undefined ? hb.y2 : S);
      return {
        left: tx * S + x1,
        top: ty * S + y1,
        right: tx * S + x2,
        bottom: ty * S + y2
      };
    }
  }

  _rectsOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  // horizontal collision
  _checkCollisionTilesHorizontal() {
    const left = this.pos.x;
    const top = this.pos.y;
    const right = this.pos.x + this.size.x;
    const bottom = this.pos.y + this.size.y;
    const entityRect = { left, top, right, bottom };

    const tileLeft = Math.floor(left / World.TILE_SIZE);
    const tileTop = Math.floor(top / World.TILE_SIZE);
    const tileRight = Math.floor((right - 1e-6) / World.TILE_SIZE);
    const tileBottom = Math.floor((bottom - 1e-6) / World.TILE_SIZE);

    const hits = [];

    for (let tx = tileLeft; tx <= tileRight; tx++) {
      for (let ty = tileTop; ty <= tileBottom; ty++) {
        const tile = World.getTileAt(new Vec2(tx, ty), World.layers.GROUND);
        const info = World.tileInfo?.[tile];
        if (!info) continue;

        // skip semisolid for horizontal checks
        if (info.semisolid) continue;

        const hb = this._getTileHitbox(tx, ty, info);
        if (!this._rectsOverlap(entityRect, hb)) continue;

        hits.push({ tx, ty, info, hitbox: hb, semisolid: false });
      }
    }
    return hits.length ? hits : null;
  }

  // vertical collision
  _checkCollisionTilesVertical() {
    const left = this.pos.x;
    const top = this.pos.y;
    const right = this.pos.x + this.size.x;
    const bottom = this.pos.y + this.size.y;
    const entityRect = { left, top, right, bottom };

    const tileLeft = Math.floor(left / World.TILE_SIZE);
    const tileTop = Math.floor(top / World.TILE_SIZE);
    const tileRight = Math.floor((right - 1e-6) / World.TILE_SIZE);
    const tileBottom = Math.floor((bottom - 1e-6) / World.TILE_SIZE);

    const hits = [];

    const prevBottom = (this.prevPos?.y ?? this.pos.y) + (this.prevSize?.y ?? this.size.y);
    const EPS = 1e-6;
    const movingDown = (this.vel.y >= -EPS);

    for (let tx = tileLeft; tx <= tileRight; tx++) {
      for (let ty = tileTop; ty <= tileBottom; ty++) {
        const tile = World.getTileAt(new Vec2(tx, ty), World.layers.GROUND);
        const info = World.tileInfo?.[tile];
        if (!info) continue;

        const hb = this._getTileHitbox(tx, ty, info);

        if (info.semisolid) {
          const wasAbove = prevBottom <= hb.top + EPS;
          const isNowOver = bottom > hb.top + EPS;
          if (movingDown && wasAbove && isNowOver && this._rectsOverlap(entityRect, hb)) {
            hits.push({ tx, ty, info, hitbox: hb, semisolid: true });
          }
        } else {
          if (this._rectsOverlap(entityRect, hb)) {
            hits.push({ tx, ty, info, hitbox: hb, semisolid: false });
          }
        }
      }
    }
    return hits.length ? hits : null;
  }

  _handleCollisions(collisions, axis, stepSign) {
    if (!collisions || !collisions.length) return false;

    if (axis === "x") {
      const solids = collisions.filter(c => c && !c.semisolid && c.info?.solid && c.hitbox);
      if (!solids.length) return false;

      if (stepSign > 0) {
        let minLeft = Infinity;
        for (const c of solids) if (c.hitbox.left < minLeft) minLeft = c.hitbox.left;
        this.pos.x = minLeft - this.size.x - this.EPS_RESOLVE;
      } else {
        let maxRight = -Infinity;
        for (const c of solids) if (c.hitbox.right > maxRight) maxRight = c.hitbox.right;
        this.pos.x = maxRight + this.EPS_RESOLVE;
      }
      this.vel.x = 0;
      return true;
    } else {
      let solids;
      if (stepSign > 0) {
        solids = collisions.filter(c => c && (c.semisolid || c.info?.solid) && c.hitbox);
      } else {
        solids = collisions.filter(c => c && !c.semisolid && c.info?.solid && c.hitbox);
      }
      if (!solids.length) return false;

      if (stepSign > 0) {
        let minTop = Infinity;
        for (const c of solids) if (c.hitbox.top < minTop) minTop = c.hitbox.top;
        this.pos.y = minTop - this.size.y - this.EPS_RESOLVE;
        this.onGround = true;
        if (typeof this.swipedSinceGrounded !== "undefined") this.swipedSinceGrounded = false;
      } else {
        let maxBottom = -Infinity;
        for (const c of solids) if (c.hitbox.bottom > maxBottom) maxBottom = c.hitbox.bottom;
        this.pos.y = maxBottom + this.EPS_RESOLVE;
      }
      this.vel.y = 0;
      return true;
    }
  }

  _moveSwept(delta, newContacts = {}, dt) {
    if (!delta) return;

    this.onGround = false;

    const EPS = 1e-9;
    let remaining = delta.clone();

    const MAX_ITER = this.MAX_PHYS_ITER ?? 64;
    let iter = 0;

    while ((Math.abs(remaining.x) > EPS || Math.abs(remaining.y) > EPS) && iter < MAX_ITER) {
      iter++;

      const curLeft = this.pos.x;
      const curTop = this.pos.y;
      const curRight = this.pos.x + this.size.x;
      const curBottom = this.pos.y + this.size.y;

      const endLeft = this.pos.x + remaining.x;
      const endTop = this.pos.y + remaining.y;
      const endRight = endLeft + this.size.x;
      const endBottom = endTop + this.size.y;

      const sweepLeft = Math.min(curLeft, endLeft);
      const sweepTop = Math.min(curTop, endTop);
      const sweepRight = Math.max(curRight, endRight);
      const sweepBottom = Math.max(curBottom, endBottom);

      const tileLeft = Math.floor(sweepLeft / World.TILE_SIZE);
      const tileTop = Math.floor(sweepTop / World.TILE_SIZE);
      const tileRight = Math.floor((sweepRight - 1e-6) / World.TILE_SIZE);
      const tileBottom = Math.floor((sweepBottom - 1e-6) / World.TILE_SIZE);

      const candidates = [];

      // build candidate list
      for (let tx = tileLeft; tx <= tileRight; tx++) {
        for (let ty = tileTop; ty <= tileBottom; ty++) {
          const tile = World.getTileAt(new Vec2(tx, ty), World.layers.GROUND);
          const info = World.tileInfo?.[tile];
          if (!info) continue;
          const hb = this._getTileHitbox(tx, ty, info);
          candidates.push({ tx, ty, info, hitbox: hb, semisolid: !!info.semisolid });
        }
      }

      const collisions = [];

      const dx = remaining.x;
      const dy = remaining.y;

      const p0 = { left: curLeft, top: curTop, right: curRight, bottom: curBottom };

      for (const c of candidates) {
        const hb = c.hitbox;
        let tEntryX, tExitX, tEntryY, tExitY;

        if (Math.abs(dx) < 1e-12) {
          if (p0.right <= hb.left || p0.left >= hb.right) {
            continue;
          } else {
            tEntryX = -Infinity;
            tExitX = Infinity;
          }
        } else {
          const invDx = 1 / dx;
          const tx1 = (hb.left - p0.right) * invDx;
          const tx2 = (hb.right - p0.left) * invDx;
          tEntryX = Math.min(tx1, tx2);
          tExitX = Math.max(tx1, tx2);
        }

        if (Math.abs(dy) < 1e-12) {
          if (p0.bottom <= hb.top || p0.top >= hb.bottom) {
            continue;
          } else {
            tEntryY = -Infinity;
            tExitY = Infinity;
          }
        } else {
          const invDy = 1 / dy;
          const ty1 = (hb.top - p0.bottom) * invDy;
          const ty2 = (hb.bottom - p0.top) * invDy;
          tEntryY = Math.min(ty1, ty2);
          tExitY = Math.max(ty1, ty2);
        }

        const tEntry = Math.max(tEntryX, tEntryY);
        const tExit = Math.min(tExitX, tExitY);

        if (tEntry <= tExit && tEntry >= -EPS && tEntry <= 1 + EPS) {
          let normal = { x: 0, y: 0 };

          if (tEntryX > tEntryY + this.EPS_TIE) {
            normal.x = dx > 0 ? -1 : 1;
          } else if (tEntryY > tEntryX + this.EPS_TIE) {
            normal.y = dy > 0 ? -1 : 1;
          } else {
            if (Math.abs(dy) >= Math.abs(dx)) {
              normal.y = dy > 0 ? -1 : 1;
            } else {
              normal.x = dx > 0 ? -1 : 1;
            }
          }

          collisions.push({
            tEntry: Math.max(0, Math.min(1, tEntry)),
            tEntryX,
            tEntryY,
            info: c.info,
            hitbox: hb,
            semisolid: c.semisolid,
            normal,
            tx: c.tx,
            ty: c.ty
          });
        }
      }

      if (!collisions.length) {
        this.pos.x += remaining.x;
        this.pos.y += remaining.y;
        remaining.x = 0;
        remaining.y = 0;
        break;
      }

      // sort by earliest impact time
      collisions.sort((a, b) => {
        const diff = a.tEntry - b.tEntry;
        if (Math.abs(diff) > 1e-12) return diff;
        if (a.tx !== b.tx) return a.tx - b.tx;
        return a.ty - b.ty;
      });

      // find first blocking collision
      const prevBottom = (this.prevPos?.y ?? this.pos.y) + (this.prevSize?.y ?? this.size.y);
      let blockingIndex = -1;
      for (let i = 0; i < collisions.length; i++) {
        const c = collisions[i];
        const key = `${c.tx},${c.ty}`;
        const prevHit = !!this._prevContacts[key];
        const semisolidBlock = c.semisolid && c.normal.y === -1 && prevBottom <= c.hitbox.top + 1e-6;
        if ((c.info?.solid) || semisolidBlock || prevHit) {
          blockingIndex = i;
          break;
        }
      }

      const blockT = blockingIndex === -1 ? Infinity : collisions[blockingIndex].tEntry;

      for (const c of collisions) {
        if (c.tEntry <= blockT + 1e-6) {
          const key = `${c.tx},${c.ty}`;
          newContacts[key] = { hitbox: c.hitbox, info: c.info, semisolid: c.semisolid };

          if (typeof this.onTileCollision === "function") {
            try {
              this.onTileCollision(c);
            } catch (e) {
              console.error("onTileCollision error:", e);
            }
          }
        }
      }

      if (blockingIndex === -1) {
        this.pos.x += remaining.x;
        this.pos.y += remaining.y;
        remaining.x = 0;
        remaining.y = 0;
        break;
      }

      // move to impact point
      const hit = collisions[blockingIndex];
      const t = Math.max(0, Math.min(1, hit.tEntry));
      const moveX = remaining.x * t;
      const moveY = remaining.y * t;
      const moved = new Vec2(moveX, moveY);

      this.pos.x += moveX;
      this.pos.y += moveY;

      const n = hit.normal;
      if (Math.abs(n.x) > 0.5) {
        if (n.x > 0) {
          this.pos.x = hit.hitbox.right + this.EPS_RESOLVE;
        } else {
          this.pos.x = hit.hitbox.left - this.size.x - this.EPS_RESOLVE;
        }
      }
      if (Math.abs(n.y) > 0.5) {
        if (n.y > 0) {
          // ceiling
          this.pos.y = hit.hitbox.bottom + this.EPS_RESOLVE;
        } else {
          // floor
          this.pos.y = hit.hitbox.top - this.size.y - this.EPS_RESOLVE;
          this.onGround = true;
          if (typeof this.swipedSinceGrounded !== "undefined") this.swipedSinceGrounded = false;
        }
      }

      if (Math.abs(n.x) > 0.5) {
        const vIntoX = this.vel.x * n.x;
        if (vIntoX < 0) {
          this.vel.x -= n.x * vIntoX;
          if (Math.abs(this.vel.x) < 1e-6) this.vel.x = 0;
        }
      }
      if (Math.abs(n.y) > 0.5) {
        const vIntoY = this.vel.y * n.y;
        if (vIntoY < 0) {
          this.vel.y -= n.y * vIntoY;
          if (Math.abs(this.vel.y) < 1e-6) this.vel.y = 0;
        }
      }

      remaining.x -= moved.x;
      remaining.y -= moved.y;

      if (Math.abs(n.x) > 0.5) {
        const remIntoX = remaining.x * n.x;
        if (remIntoX < 0) remaining.x -= n.x * remIntoX;
      }
      if (Math.abs(n.y) > 0.5) {
        const remIntoY = remaining.y * n.y;
        if (remIntoY < 0) remaining.y -= n.y * remIntoY;
      }
      const movedLenSq = moved.x * moved.x + moved.y * moved.y;
      if (movedLenSq < 1e-12) break;
      World.updateEntityPosition(this, this.pos);
    }

    // ground probe
    const MIN_PROBE = 0.25;
    const MAX_PROBE = Math.max(1, World.TILE_SIZE * 0.5);
    const movementY = Math.abs(delta.y);
    const probe = Math.min(MAX_PROBE, Math.max(MIN_PROBE, movementY + 0.01));
    this.pos.y += probe;
    const collisionsBelow = this._checkCollisionTilesVertical();
    this.pos.y -= probe;
    if (collisionsBelow && collisionsBelow.length) {
      if (typeof this.onTileCollision === "function") {
        for (const c of collisionsBelow) {
          try { this.onTileCollision(c); } catch (e) { console.error("onTileCollision error:", e); }
        }
      }
      const solids = collisionsBelow.filter(c => c && (c.semisolid || c.info?.solid) && c.hitbox);
      if (solids.length) {
        let minTop = Infinity;
        for (const c of solids) if (c.hitbox.top < minTop) minTop = c.hitbox.top;
        this.pos.y = minTop - this.size.y - this.EPS_RESOLVE;
        this.vel.y = 0;
        this.onGround = true;
        if (typeof this.swipedSinceGrounded !== "undefined") this.swipedSinceGrounded = false;
      }
    }
    World.updateEntityPosition(this, this.pos);
  }
}