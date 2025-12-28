// Simple EventEmitter shim for browser environments compatible with Node's 'events' API surface used by libraries.
type Listener = (...args: any[]) => void;

export class EventEmitter {
  private listeners: Map<string | symbol, Set<Listener>> = new Map();

  on(event: string | symbol, listener: Listener) {
    const s = this.listeners.get(event) || new Set();
    s.add(listener);
    this.listeners.set(event, s);
    return this;
  }
  addListener(event: string | symbol, listener: Listener) {
    return this.on(event, listener);
  }
  once(event: string | symbol, listener: Listener) {
    const wrapped: Listener = (...args: any[]) => {
      this.removeListener(event, wrapped);
      listener(...args);
    };
    return this.on(event, wrapped);
  }
  removeListener(event: string | symbol, listener: Listener) {
    const s = this.listeners.get(event);
    if (s) {
      s.delete(listener);
      if (s.size === 0) this.listeners.delete(event);
    }
    return this;
  }
  off(event: string | symbol, listener: Listener) {
    return this.removeListener(event, listener);
  }
  emit(event: string | symbol, ...args: any[]) {
    const s = this.listeners.get(event);
    if (!s) return false;
    for (const l of Array.from(s)) {
      try { l(...args); } catch {}
    }
    return true;
  }
  removeAllListeners(event?: string | symbol) {
    if (event === undefined) this.listeners.clear();
    else this.listeners.delete(event);
    return this;
  }
  listenerCount(event: string | symbol) {
    const s = this.listeners.get(event);
    return s ? s.size : 0;
  }
}

export default EventEmitter;


