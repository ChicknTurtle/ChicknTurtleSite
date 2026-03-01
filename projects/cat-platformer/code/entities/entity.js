import { Vec2 } from "../lib.js"

export class Entity {
    constructor(pos=new Vec2()) {
        this.pos = pos;
        this.vel = new Vec2(0);
        this.size = new Vec2(0);
    }
    update(dt) {}
    draw(ctx) {}
}
