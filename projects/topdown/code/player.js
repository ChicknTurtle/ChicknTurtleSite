
class Player extends Entity {
    constructor(pos) {
        super(pos, new Vec2(12,12));
        this.facing = 'down';
        this.walking = false;
        this.attackRot = 0;
    }
    tick() {
        const dt = Game.dt;
        const movespeed = 120;
        const diagonalSpeed = movespeed*1.0;
        const friction = 10000;

        if (Game.mouseGamePos) {
            const angle = this.pos.plus(this.size.divided(2)).minus(Game.mouseGamePos);
            this.attackRot = Math.atan2(angle.y, angle.x) + Math.PI/2;
        }
        
        let moveX = 0;
        let moveY = 0;
        if (Game.keybinds['walkUp']) {
            if (Game.keybinds['walkLeft'] || Game.keybinds['walkRight']) {
                moveY -= diagonalSpeed;
            } else {
                moveY -= movespeed;
            }
        }
        if (Game.keybinds['walkDown']) {
            if (Game.keybinds['walkLeft'] || Game.keybinds['walkRight']) {
                moveY += diagonalSpeed;
            } else {
                moveY += movespeed;
            }
        }
        if (Game.keybinds['walkLeft']) {
            if (Game.keybinds['walkUp'] || Game.keybinds['walkDown']) {
                moveX -= diagonalSpeed;
            } else {
                moveX -= movespeed;
            }
        }
        if (Game.keybinds['walkRight']) {
            if (Game.keybinds['walkUp'] || Game.keybinds['walkDown']) {
                moveX += diagonalSpeed;
            } else {
                moveX += movespeed;
            }
        }
        if (moveX !== 0 || moveY !== 0) {
            this.walking = true;
            if (moveX !== 0) {
                this.facing = moveX > 0 ? 'right' : 'left';
            } else {
                this.facing = moveY > 0 ? 'down' : 'up';
            }
        } else {
            this.walking = false;
        }
        this.pos.add(this.vel);
        this.vel.multiply(Math.pow(1/friction, dt))
        this.pos.x += moveX * dt;
        this.pos.y += moveY * dt;

        Game.cam.pos = this.pos.plus(this.size.divided(2)).plus(new Vec2((Game.canvas.width/Game.dpr/Game.cam.zoom)/-2, (Game.canvas.height/Game.dpr/Game.cam.zoom)/-2));
    }
    draw(ctx) {
        const texSize = new Vec2(24);
        const translate = this.pos.plus(this.size.divided(2));
        ctx.save()
        ctx.translate(translate.x, translate.y);

        this.drawShadow(ctx, 12, 4);

        let sheetX = 0;
        if (this.walking) {
            sheetX = 24 + 24 * (Math.floor(Game.gameTime*4) % 2);
        }
        let sheetY = 0;
        if (this.facing === 'down') sheetY = 0;
        else if (this.facing === 'left') sheetY = 72;
        else if (this.facing === 'right') sheetY = 48;
        else if (this.facing === 'up') sheetY = 24;

        ctx.drawImage(Game.spritesheets['player'], sheetX, sheetY, 24, 24, texSize.x/-2, texSize.y/-2, 24, 24);
        ctx.restore()
        World.drawHitbox(ctx, this.pos, this.size);
    }
}
