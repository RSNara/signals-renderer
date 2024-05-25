import { State } from './signal';
import { effect } from './effect';

/**
 * ['div']
 */

let currentInstance = null;
let hookIndex = 0;

export function Render(el, tree) {
  let instance = {};
  effect(() => {
    const expandedTree = fullyExpandTree(tree, instance);
    renderFullyExpandedTreeToDom(el, expandedTree, 0);
  });
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

function fullyExpandTree(tree, instance) {
  if (typeof tree == 'string') {
    return tree;
  }

  if (tree == null) {
    return null;
  }

  let [type, { children = [], ...props }] = tree;
  children = children.map((child, i) => {
    if (typeof child === 'string') {
      return child;
    }

    if (child == null) {
      return null;
    }

    instance.children = instance.children || [];

    if (!instance.children[i]) {
      instance.children[i] = { type: child[0] };
    } else if (instance.children[i].type != child[0]) {
      cleanup(instance.children[i]);
      instance.children[i] = { type: child[0] };
    }

    return fullyExpandTree(child, instance.children[i]);
  });

  if (typeof type == 'string') {
    return [type, { ...props, children }, instance];
  }

  // Tear down the old instance, as necessary
  if (!instance.next) {
    instance.next = { type: type };
  } else if (instance.next.type != type) {
    cleanup(instance.next);
    instance.next = { type: type };
  }

  let previousInstance = currentInstance;
  let previousHookIndex = hookIndex;
  let renderResult = null;
  try {
    currentInstance = instance;
    hookIndex = 0;
    renderResult = type({ ...props, children });
  } finally {
    currentInstance = previousInstance;
    hookIndex = previousHookIndex;
  }

  return fullyExpandTree(renderResult, instance.next);
}

function hyphenate(camelCase) {
  return camelCase.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

function cleanup(instance) {
  if (instance.events && instance.element) {
    for (const [event, callback] of Object.entries(instance.events)) {
      instance.element.removeEventListener(event, callback);
    }
  }
}

function createElement(tag) {
  return document.createElement(tag);
}

const eventMap = {
  button: {
    onClick: 'click',
  },
  input: {
    onChange: 'input',
  },
};

function renderFullyExpandedTreeToDom(parent, tree, i) {
  if (typeof tree == 'string') {
    const el = document.createTextNode(tree);
    insertToParent(parent, el, i);
    return;
  }

  if (tree == null) {
    insertToParent(parent, null, i);
    return;
  }

  if (Array.isArray(tree)) {
    const [tag, newProps, instance] = tree;

    if (typeof tag == 'string') {
      instance.element = instance.element || createElement(tag);

      const update = diff(instance.props || {}, newProps || {});
      instance.props = newProps;
      const children = newProps.children || [];

      for (const [key, value] of Object.entries(update)) {
        if (key == 'style') {
          for (const [styleKey, styleValue] of Object.entries(value)) {
            const actualStyleKey = hyphenate(styleKey);
            instance.element.style[actualStyleKey] = styleValue;
          }
          continue;
        }

        if (['type', 'value', 'checked', 'className'].includes(key)) {
          instance.element[key] = value;
          continue;
        }

        // Is valid event?
        if (eventMap[tag] && eventMap[tag][key]) {
          const eventName = eventMap[tag][key];
          updateEventListener(instance, eventName, value);
          continue;
        }

        throw new Error('Unsupported prop: ' + key);
      }

      // Should we do more intelligent diffing for children?
      const childComponents = children.filter(Boolean);
      childComponents.forEach((child, childIndex) => {
        renderFullyExpandedTreeToDom(instance.element, child, childIndex);
      });

      for (
        let childIndex = childComponents.length;
        childIndex < instance.element.childNodes.length;
        childIndex += 1
      ) {
        renderFullyExpandedTreeToDom(instance.element, null, childIndex);
      }

      insertToParent(parent, instance.element, i);
      return;
    }
  }

  throw new Error(
    'toDom: Detected unknown tree: ' + JSON.stringify(tree, null, 2),
  );
}

function updateEventListener(instance, eventName, handler) {
  instance.events = instance.events || {};

  if (instance.events[eventName] != null) {
    instance.element.removeEventListener(eventName, instance.events[eventName]);
  }

  instance.events[eventName] = handler;
  if (handler != null) {
    instance.element.addEventListener(eventName, handler);
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

  console.log('Update payload: ', JSON.stringify(update, null, 2));

  return update;
}

export function useState(initial) {
  let i = hookIndex++;
  currentInstance.hooks = currentInstance.hooks || [];
  currentInstance.hooks[i] = currentInstance.hooks[i] || new State(initial);
  const state = currentInstance.hooks[i];
  return [state.get(), (newVal) => state.set(newVal)];
}
