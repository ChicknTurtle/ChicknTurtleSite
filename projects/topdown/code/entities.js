
class Entity {
    constructor(pos, size) {
        this.pos = pos ?? new Vec2();
        this.size = size ?? new Vec2();
        this.vel = new Vec2();
    }
    tick() {}
    draw(ctx) {}
    drawShadow(ctx, size, yOffset=0) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(0, yOffset, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
