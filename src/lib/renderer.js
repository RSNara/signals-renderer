import { Computed, State } from './signal';
import { effect } from './effect';

/**
 * ['div']
 */

const Tag = {
  String: Symbol.for('string'),
  Null: Symbol.for('null'),
  Root: Symbol.for('root'),
};

class Instance {
  _children = [];
  _next = null;
  _events = {};

  static current = null;
  static hookIndex = 0;
  static uuid = 0;

  id = Instance.uuid++;

  constructor(tag) {
    this._tag = tag;
  }

  tag() {
    return this._tag;
  }

  element(tag) {
    this._element = this._element || document.createElement(tag);
    return this._element;
  }

  addEventListener(eventName, handler) {
    if (handler == null) {
      if (this._events[eventName] != null) {
        this._element.removeEventListener(eventName, this._events[eventName]);
      }
      return;
    }

    if (this._events[eventName] == handler) {
      return;
    }

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
    } else if (this._children[i].tag() != tag) {
      this._children[i].cleanup();
      this._children[i] = new Instance(tag);
    }
    return this._children[i];
  }

  next(tag) {
    // Tear down the old instance, as necessary
    if (!this._next) {
      // console.log('Creating nexxt (does not exist): ', tag);
      this._next = new Instance(tag);
    } else if (this._next.tag() != tag) {
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
      return tag(props);
    } finally {
      Instance.current = previousInstance;
      Instance.hookIndex = previousHookIndex;
    }
  }
}

class Element {
  constructor(tag, props, children, instance) {
    this._tag = tag;
    this._children = children;
    this._instance = instance;
    this._props = props;
  }

  tag() {
    return this._tag;
  }

  children() {
    return this._children;
  }

  instance() {
    return this._instance;
  }

  static forString(str) {
    return new Element(Tag.String, {}, [str], null);
  }

  static forNull() {
    return new Element(Tag.Null, {}, [], null);
  }

  diff() {
    const oldProps = this._instance._props || {};
    const newProps = this._props || {};
    this._instance._props = newProps;
    return diff(oldProps, newProps);
  }
}

export function Render(el, tree) {
  const rootInstance = new Instance(Tag.Root);
  effect(() => {
    const elementTree = createElementTree(tree, rootInstance);
    renderElementTree(el, elementTree, 0);
  });
}

function createElementTree(tree, instance) {
  if (typeof tree == 'string') {
    return Element.forString(tree);
  }

  if (tree == null) {
    return Element.forNull();
  }

  const tag = tree[0];
  const props = tree[1];

  if (typeof tag == 'string') {
    const { children = [], ...elementProps } = props;
    const elementChildren = children.map((child, i) => {
      if (typeof child === 'string') {
        return Element.forString(child);
      }

      if (child == null) {
        return Element.forNull();
      }

      const childInstance = instance.nthChild(child[0], i);
      return createElementTree(child, childInstance);
    });

    const element = new Element(tag, elementProps, elementChildren, instance);
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
  if (tree.tag() === Tag.String) {
    const el = document.createTextNode(tree.children()[0]);
    insertToParent(parent, el, i);
    return;
  }

  if (tree.tag() == Tag.Null) {
    insertToParent(parent, null, i);
    return;
  }

  const tag = tree.tag();
  const instance = tree.instance();
  const update = tree.diff();
  const element = instance.element(tree.tag());

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
      instance.addEventListener(eventName, value);
      continue;
    }

    throw new Error('Unsupported prop: ' + key);
  }

  // Should we do more intelligent diffing for children?
  const childComponents = tree
    .children()
    .filter((child) => child.tag() != Tag.Null);
  childComponents.forEach((child, childIndex) => {
    renderElementTree(element, child, childIndex);
  });

  for (
    let childIndex = childComponents.length;
    childIndex < element.childNodes.length;
    childIndex += 1
  ) {
    renderElementTree(element, null, childIndex);
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

export function useState(initial, log) {
  let i = Instance.hookIndex++;
  Instance.current.hooks = Instance.current.hooks || [];
  Instance.current.hooks[i] = Instance.current.hooks[i] || new State(initial);
  const state = Instance.current.hooks[i];
  return [
    state.get(),
    (newVal) => {
      state.set(newVal);
    },
  ];
}
