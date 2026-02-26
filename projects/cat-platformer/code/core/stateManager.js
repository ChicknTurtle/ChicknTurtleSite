
export const StateManager = {
  current: null,
  pending: null,
  states: {},
  register(name, module) { this.states[name] = module; },

  change(name, payload) {
    console.debug(`Switching state '${this.current}' -> '${name}'`);
    this.pending = { name, payload };
  },

  _applyPending() {
    if (!this.pending) return;
    const { name, payload } = this.pending;
    this.pending = null;
    if (this.current && this.states[this.current] && this.states[this.current].exit) {
      try { this.states[this.current].exit(); } catch (e) { console.error('State exit error:', e) }
    }
    this.current = name;
    if (this.states[name] && this.states[name].enter) {
      try { this.states[name].enter(payload); } catch (e) { console.error('State enter error:', e) }
    }
  },

  update(dt) {
    this._applyPending();
    if (this.current && this.states[this.current] && this.states[this.current].update) {
      this.states[this.current].update(dt);
    }
  },
};
