import { Vec2 } from "../utils/lib.js"
import { Game } from "../game.js"
import { Entity } from "./entity.js"
import { WorldUtils } from "../world/utils.js"

export class CoinEntity extends Entity {
    constructor(pos=new Vec2()) {
        super(pos);
        this.size = new Vec2(16,16);
    }
    draw(ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(Game.textures['entities'], 0, 0, 16, 16, this.pos.x, this.pos.y, this.size.x, this.size.y);
        WorldUtils.drawHitbox(ctx, this.pos, this.size, 'red');
    }
}
