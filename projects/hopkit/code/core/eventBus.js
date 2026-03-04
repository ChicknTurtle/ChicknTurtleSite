
export const EventBus = {
  _subs: new Map(),

  on(event, cb) {
    if (!this._subs.has(event)) this._subs.set(event, []);
    this._subs.get(event).push(cb);
    return cb;
  },

  once(event, cb) {
    const wrapper = (payload) => {
      cb(payload);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  },

  off(event, cb) {
    const arr = this._subs.get(event);
    if (!arr) return;
    const i = arr.indexOf(cb);
    if (i >= 0) arr.splice(i, 1);
    if (arr.length === 0) this._subs.delete(event);
  },

  emit(event, payload) {
    const arr = this._subs.get(event);
    if (!arr) return;
    const copy = arr.slice();
    for (let i = 0; i < copy.length; i++) copy[i](payload);
  }
};
