import { Computed, State } from './signal';
import { effect } from './effect';

/**
 * ['div']
 */

class Instance {
  _children = [];
  _next = null;
  _events = {};

  static current = null;
  static hookIndex = 0;

  constructor(tag) {
    this._tag = tag;
  }

  element(tag) {
    this._element = this._element || document.createElement(tag);
    return this._element;
  }

  addEventListener(eventName, handler) {
    if (this._events[eventName] != null) {
      this._element.removeEventListener(eventName, this._events[eventName]);
    }

    this._events[eventName] = handler;
    if (handler != null) {
      this._element.addEventListener(eventName, handler);
    }
  }

  attachElement(element) {
    this._element = element;
  }

  cleanup() {
    if (this._events && this._element) {
      for (const [event, callback] of Object.entries(this._events)) {
        this._element.removeEventListener(event, callback);
      }
    }
  }

  nthChild(tag, i) {
    if (!this._children[i]) {
      this._children[i] = new Instance(tag);
    } else if (this._children[i].tag != tag) {
      this._children[i].cleanup();
      this._children[i] = new Instance(tag);
    }
    return this._children[i];
  }

  next(tag) {
    // Tear down the old instance, as necessary
    if (!this._next) {
      this._next = new Instance(tag);
    } else if (this._next.tag != tag) {
      this._next.cleanup();
      this._next = new Instance(tag);
    }
    return this._next;
  }

  render(tag, props) {
    let previousInstance = Instance.current;
    let previousHookIndex = Instance.hookIndex;
    try {
      Instance.current = this;
      Instance.hookIndex = 0;
      this._update = diff(this._props || {}, props || {});
      this._props = props;
      return tag(props);
    } finally {
      Instance.current = previousInstance;
      Instance.hookIndex = previousHookIndex;
    }
  }

  updatePayload() {
    return this._update;
  }
}

class Element {
  constructor(tag, children, instance) {
    this.tag = tag;
    this.children = children;
    this.instance = instance;
  }

  static forString(str) {
    return new Element(Symbol.for('string'), {}, [str], null);
  }

  static forNull() {
    return new Element(Symbol.for('null'), {}, [], null);
  }
}

export function Render(el, tree) {
  effect(() => {
    const elementTree = createElementTree(tree);
    renderElementTree(el, elementTree, 0);
  });
}

function createElementTree(tree, instance = new Instance(Symbol.for('root'))) {
  if (typeof tree == 'string') {
    return Element.forString(tree);
  }

  if (tree == null) {
    return Element.forNull();
  }

  const tag = tree[0];
  const props = tree[1];

  if (typeof tag == 'string') {
    const { children = [] } = props;
    const elementChildren = children.map((child, i) => {
      if (typeof child === 'string') {
        return Element.forString(child);
      }

      if (typeof child == null) {
        return Element.forNull();
      }

      const childInstance = instance.nthChild(child[0], i);
      return createElementTree(child, childInstance);
    });

    const element = new Element(tag, elementChildren, instance);
    return element;
  }

  const nextInstance = instance.next(tag);
  const renderResult = nextInstance.render(tag, props);

  return createElementTree(renderResult, nextInstance);
}

function hyphenate(camelCase) {
  return camelCase.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

const eventMap = {
  button: {
    onClick: 'click',
  },
  input: {
    onChange: 'input',
  },
};

function renderElementTree(parent, tree, i) {
  if (tree.tag === Symbol.for('string')) {
    const el = document.createTextNode(tree);
    insertToParent(parent, el, i);
    return;
  }

  if (tree.tag == Symbol.for('null')) {
    insertToParent(parent, null, i);
    return;
  }

  const instance = tree.instance;
  const update = instance.updatePayload();
  const element = instance.element(tree.tag);

  for (const [key, value] of Object.entries(update)) {
    if (key == 'style') {
      for (const [styleKey, styleValue] of Object.entries(value)) {
        const actualStyleKey = hyphenate(styleKey);
        element.style[actualStyleKey] = styleValue;
      }
      continue;
    }

    if (['type', 'value', 'checked', 'className'].includes(key)) {
      element[key] = value;
      continue;
    }

    // Is valid event?
    if (eventMap[tag] && eventMap[tag][key]) {
      const eventName = eventMap[tag][key];
      console.log('attaching event listener: ' + eventName);
      instance.addEventListener(eventName, value);
      continue;
    }

    throw new Error('Unsupported prop: ' + key);
  }

  // Should we do more intelligent diffing for children?
  const childComponents = tree.children.filter(Boolean);
  childComponents.forEach((child, childIndex) => {
    renderFullyExpandedTreeToDom(element, child, childIndex);
  });

  for (
    let childIndex = childComponents.length;
    childIndex < element.childNodes.length;
    childIndex += 1
  ) {
    renderFullyExpandedTreeToDom(element, null, childIndex);
  }

  insertToParent(parent, element, i);
}

function insertToParent(parent, el, i) {
  if (parent.childNodes[i] == el) {
    return;
  }

  if (parent.childNodes[i] != null && el == null) {
    parent.removeChild(parent.childNodes[i]);
    return;
  }

  if (parent.childNodes[i]) {
    parent.replaceChild(el, parent.childNodes[i]);
  } else {
    parent.appendChild(el);
  }
}

function diff(oldProps, newProps) {
  const update = {};
  const allProps = new Set(Object.keys(newProps).concat(Object.keys(oldProps)));

  for (const key of allProps) {
    if (key == 'children') {
      continue;
    }

    if (key == 'style') {
      update[key] = diff(oldProps.style || {}, newProps.style || {});
      continue;
    }

    if (oldProps[key] == null && newProps[key] != null) {
      update[key] = newProps[key];
      continue;
    }

    if (oldProps[key] != null && newProps[key] == null) {
      update[key] = null;
      continue;
    }

    if (oldProps[key] == newProps[key]) {
      continue;
    }

    update[key] = newProps[key];
  }

  return update;
}

export function useState(initial) {
  let i = Instance.hookIndex++;
  Instance.current.hooks = Instance.current.hooks || [];
  Instance.current.hooks[i] = Instance.current.hooks[i] || new State(initial);
  const state = Instance.current.hooks[i];
  return [state.get(), (newVal) => state.set(newVal)];
}
