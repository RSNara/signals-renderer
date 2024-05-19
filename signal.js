export class State {
  constructor(initialVal, label) {
    this.parents = new Set();
    this.cached = initialVal;
    this.label = label;
  }

  get() {
    if (Computed.current != null) {
      this.parents.add(Computed.current);
    }

    return this.cached;
  }

  set(newVal) {
    if (this.cached != newVal) {
      this.cached = newVal;
      this._markParentsDirty();
    }
  }

  _markParentsDirty() {
    let queue = [...this.parents];
    while (true) {
      let node = queue.pop();
      if (node == null) {
        return;
      }

      node.dirty = true;
      queue.push.apply(queue, [...node.parents]);
    }
  }
}

export class Computed {
  static current = null;

  constructor(factory, label) {
    this.factory = factory;
    this.parents = new Set();
    this.dirty = true;
    this.cached = null;
    this.label = label;
  }

  get() {
    if (Computed.current != null) {
      this.parents.add(Computed.current);
    }

    if (this.dirty) {
      this.cached = this.compute();
      this.dirty = false;
    }

    return this.cached;
  }

  compute() {
    const old = Computed.current;
    try {
      Computed.current = this;
      return this.factory();
    } finally {
      Computed.current = old;
    }
  }
}
