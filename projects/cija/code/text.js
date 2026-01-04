
const Text = {
  Component: class {
    constructor(text) {
      this.text = text;
      this.effects = {
        shake: 0,
        wave: 0,
        shadow: { pos: new Vec2(0, 0), color: 'black' }
      };
    }
  },

  draw: function (ctx, components, pos) {
    if (!Array.isArray(components)) {
      components = [components];
    }
    const allText = components.map(c => {
      if (!(c instanceof Text.Component)) {
        return c;
      }
      return c.text;
    }).join('');
    const totalWidth = ctx.measureText(allText).width;
    const startAlign = ctx.textAlign;
    const startStyle = ctx.fillStyle;
    switch (startAlign) {
      case 'center':
        pos.x -= totalWidth / 2;
        break;
      case 'right':
      case 'end':
        pos.x -= totalWidth;
        break;
      case 'left':
      case 'start':
      default:
        break;
    }
    ctx.textAlign = 'left';
    let startX = 0;
    components.forEach(c => {
      if (!(c instanceof Text.Component)) {
        c = new Text.Component(c);
      }
      const shake = c.effects.shake ?? 0;
      const wave = c.effects.wave ?? 0;
      const wavespeed = c.effects.wavespeed ?? 0;
      const shadow = c.effects.shadow ?? { pos: new Vec2(0, 0), color: 'black' };
      const drawShadow = !shadow.pos.isZero();
      if (shake > 0 || wave > 0) {
        text = c.text.split('');
      } else {
        text = [c.text];
      }
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charOffset = new Vec2();
        charOffset.x += (Math.random() - 0.5) * shake;
        charOffset.y += (Math.random() - 0.5) * shake + Math.sin(Game.gameTime * wavespeed + i) * wave;
        if (drawShadow) {
          ctx.fillStyle = shadow.color;
          ctx.fillText(char, pos.x + startX + charOffset.x + shadow.pos.x, pos.y + charOffset.y + shadow.pos.y);
          ctx.fillStyle = startStyle;
        };
        ctx.fillText(char, pos.x + startX + charOffset.x, pos.y + charOffset.y);
        startX += ctx.measureText(char).width;
      }
    });
    ctx.textAlign = startAlign;
  },
}
