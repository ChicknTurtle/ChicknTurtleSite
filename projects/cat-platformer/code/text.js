
import { Vec2 } from "./lib.js"

export const Text = {
  effectDefs: {
    color: {
      default: null,
      clone: v => (v == null ? null : v),
      type: 'string',
    },
    shake: {
      default: 0,
      clone: v => (typeof v === 'number' ? v : Number(v) || 0),
      type: 'number',
    },
    shadowColor: {
      default: null,
      clone: v => (v == null ? null : v),
      type: 'string',
    },
    shadowOffset: {
      default: new Vec2(0, 0),
      clone: v => Text.Component._cloneVec2(v),
      type: 'vec2',
    },
    font: {
      default: null,
      clone: v => (v == null ? null : v),
      type: 'string',
    },
  },

  _createDefaultEffects() {
    const out = {};
    for (const [k, def] of Object.entries(Text.effectDefs)) {
      out[k] = def.clone(def.default);
    }
    return out;
  },

  _cloneEffects(effects) {
    const out = {};
    for (const [k, def] of Object.entries(Text.effectDefs)) {
      if (effects && effects.hasOwnProperty(k)) out[k] = def.clone(effects[k]);
      else out[k] = def.clone(def.default);
    }
    return out;
  },

  _isDefaultValue(key, value) {
    const def = Text.effectDefs[key];
    if (!def) return value == null;
    const d = def.default;
    if (def.type === 'vec2') {
      const vx = value || d;
      const dx = d;
      return (vx == null && dx == null) || (vx && dx && Number(vx.x) === Number(dx.x) && Number(vx.y) === Number(dx.y));
    }
    if (def.type === 'number') {
      return Number(value) === Number(d);
    }
    return value === d;
  },

  _sparsifyEffects(effects) {
    const out = {};
    for (const [k, def] of Object.entries(Text.effectDefs)) {
      if (!effects || !effects.hasOwnProperty(k)) continue;
      const v = effects[k];
      if (!Text._isDefaultValue(k, v)) out[k] = def.clone(v);
    }
    return out;
  },

  Component: class {
    constructor(input) {
      if (Array.isArray(input)) {
        this.components = input.map(c => (c instanceof Text.Component) ? c.copy() : new Text.Component(c));
        this.effects = Text._createDefaultEffects();
        return;
      }

      if (input instanceof Text.Component) {
        return input.copy();
      }

      this.text = input?.toString() ?? "";
      this.effects = Text._createDefaultEffects();
    }

    static _cloneVec2(v) {
      if (!v) return new Vec2(0, 0);
      return new Vec2(Number(v.x) || 0, Number(v.y) || 0);
    }

    copy() {
      if (this.components) {
        const clone = new Text.Component([]);
        clone.components = this.components.map(c => c.copy());
        clone.effects = Text._cloneEffects(this.effects);
        return clone;
      } else {
        const clone = new Text.Component(this.text);
        clone.effects = Text._cloneEffects(this.effects);
        return clone;
      }
    }

    getFlat(inherited = null) {
      const localActive = {};
      if (this.effects) {
        for (const [k, def] of Object.entries(Text.effectDefs)) {
          const val = this.effects[k];
          if (!Text._isDefaultValue(k, val)) {
            localActive[k] = def.clone(val);
          }
        }
      }

      const merged = { ...(localActive) };
      if (inherited) {
        for (const [k, v] of Object.entries(inherited)) {
          merged[k] = Text.effectDefs[k].clone(v);
        }
      }

      const effectsToPass = Text._sparsifyEffects(merged);
      const pass = Object.keys(effectsToPass).length > 0 ? effectsToPass : null;

      if (this.components) {
        return this.components.flatMap(c => c.getFlat(pass));
      }

      const leaf = this.copy();
      if (pass) {
        const base = Text._cloneEffects(leaf.effects);
        for (const [k, v] of Object.entries(pass)) {
          base[k] = Text.effectDefs[k].clone(v);
        }
        leaf.effects = base;
      }
      return [leaf];
    }

    draw(ctx, pos) {
      ctx.save();

      const components = this.getFlat();

      const defaultFont = ctx.font;
      let totalWidth = 0;
      for (const c of components) {
        if (!(c instanceof Text.Component)) continue;
        const fx = c.effects;
        ctx.font = fx.font ?? defaultFont;
        totalWidth += ctx.measureText(c.text).width;
      }

      const originalAlign = ctx.textAlign || 'left';
      switch (originalAlign) {
        case 'center':
          pos.x -= totalWidth / 2;
          break;
        case 'right':
        case 'end':
          pos.x -= totalWidth;
          break;
      }
      ctx.textAlign = 'left';

      const defaultColor = ctx.fillStyle;
      let startX = 0;

      for (const c of components) {
        if (!(c instanceof Text.Component)) continue;

        const fx = c.effects;
        const shake = fx.shake ?? 0;
        const shadowColor = fx.shadowColor;
        const shadowOffset = Text.Component._cloneVec2(fx.shadowOffset);
        const drawShadow = shadowColor != null && !(shadowOffset.x === 0 && shadowOffset.y === 0);

        ctx.font = fx.font ?? defaultFont;

        if (shake > 0) {
          for (const char of c.text.split('')) {
            const charOffsetX = (Math.random() - 0.5) * shake;
            const charOffsetY = (Math.random() - 0.5) * shake;
            const x = pos.x + startX + charOffsetX;
            const y = pos.y + charOffsetY;

            if (drawShadow) {
              ctx.fillStyle = shadowColor;
              ctx.fillText(char, x + shadowOffset.x, y + shadowOffset.y);
            }
            ctx.fillStyle = fx.color ?? defaultColor;
            ctx.fillText(char, x, y);

            startX += ctx.measureText(char).width;
          }
        } else {
          if (drawShadow) {
            ctx.fillStyle = shadowColor;
            ctx.fillText(c.text, pos.x + startX + shadowOffset.x, pos.y + shadowOffset.y);
          }
          ctx.fillStyle = fx.color ?? defaultColor;
          ctx.fillText(c.text, pos.x + startX, pos.y);
          startX += ctx.measureText(c.text).width;
        }
      }

      ctx.restore();
    }
  },

  parse(input) {
    const tagRegex = /(?<!\\)<(!?)([^:>]+)(?::([^>]+))?>/g;
    const VALID_TAGS = new Set(['color', 'shake', 'shadow', 'font', 'reset']);

    let currentState = Text._createDefaultEffects();

    const cloneStateForComponent = (state) => Text._cloneEffects(state);

    const components = [];
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(input)) !== null) {
      const [, isResetFlag, keyRaw, valueRaw] = match;
      const key = keyRaw?.trim();
      const value = valueRaw;

      let textBefore = input.substring(lastIndex, match.index);
      if (textBefore) textBefore = textBefore.replace(/\\</g, '<');
      if (textBefore.length > 0) {
        const comp = new Text.Component(textBefore);
        comp.effects = cloneStateForComponent(currentState);
        components.push(comp);
      }

      if (!VALID_TAGS.has(key)) {
        lastIndex = tagRegex.lastIndex;
        continue;
      }

      const isReset = isResetFlag === '!';

      if (isReset) {
        switch (key) {
          case 'color':
            currentState.color = Text.effectDefs.color.clone(Text.effectDefs.color.default);
            break;
          case 'shake':
            currentState.shake = Text.effectDefs.shake.clone(Text.effectDefs.shake.default);
            break;
          case 'shadow':
            currentState.shadowColor = Text.effectDefs.shadowColor.clone(Text.effectDefs.shadowColor.default);
            currentState.shadowOffset = Text.effectDefs.shadowOffset.clone(Text.effectDefs.shadowOffset.default);
            break;
          case 'font':
            currentState.font = Text.effectDefs.font.clone(Text.effectDefs.font.default);
            break;
          case 'reset':
            currentState = Text._createDefaultEffects();
            break;
        }
      } else {
        switch (key) {
          case 'reset':
            currentState = Text._createDefaultEffects();
            break;
          case 'color':
            if (value != null) currentState.color = Text.effectDefs.color.clone(value);
            break;
          case 'shake':
            currentState.shake = Text.effectDefs.shake.clone(value);
            break;
          case 'shadow':
            if (value != null) {
              const parts = value.split(',').map(s => s.trim());
              const ox = parseFloat(parts[0]) || 0;
              const oy = parseFloat(parts[1]) || 0;
              currentState.shadowOffset = Text.effectDefs.shadowOffset.clone(new Vec2(ox, oy));
              if (parts[2] !== undefined && parts[2] !== '') {
                currentState.shadowColor = Text.effectDefs.shadowColor.clone(parts[2]);
              }
            }
            break;
          case 'font':
            if (value != null) currentState.font = Text.effectDefs.font.clone(value);
            break;
        }
      }

      lastIndex = tagRegex.lastIndex;
    }

    let remainingText = input.substring(lastIndex);
    if (remainingText) remainingText = remainingText.replace(/\\</g, '<');
    if (remainingText.length > 0) {
      const comp = new Text.Component(remainingText);
      comp.effects = cloneStateForComponent(currentState);
      components.push(comp);
    }

    return new Text.Component(components);
  },

  draw(ctx, text, pos) {
    if (!(text instanceof Text.Component)) {
      text = new Text.Component(text);
    }
    text.draw(ctx, pos);
  }
};
