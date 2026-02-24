// Singleton EventEmitter for cross-system communication.
// Uses a minimal custom EventEmitter so it works before Phaser loads.

class MiniEmitter {
  constructor() {
    this._listeners = {};
  }

  on(event, fn, context) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push({ fn, context });
    return this;
  }

  once(event, fn, context) {
    const wrapper = (...args) => {
      fn.apply(context, args);
      this.off(event, wrapper, context);
    };
    return this.on(event, wrapper, context);
  }

  off(event, fn, context) {
    if (!this._listeners[event]) return this;
    this._listeners[event] = this._listeners[event].filter(
      l => l.fn !== fn || (context && l.context !== context)
    );
    return this;
  }

  emit(event, ...args) {
    const listeners = this._listeners[event];
    if (!listeners) return false;
    // Copy so removal during emit is safe
    [...listeners].forEach(l => l.fn.apply(l.context || this, args));
    return true;
  }

  removeAllListeners(event) {
    if (event) {
      this._listeners[event] = [];
    } else {
      this._listeners = {};
    }
    return this;
  }
}

let instance = null;

export function getEventsCenter() {
  if (!instance) {
    instance = new MiniEmitter();
  }
  return instance;
}

export function resetEventsCenter() {
  if (instance) {
    instance.removeAllListeners();
  }
  instance = null;
}

export default MiniEmitter;
