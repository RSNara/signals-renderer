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
    const expandedTree = expandTree(tree, instance);
    renderToDom(el, expandedTree, 0);
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

function expandTree(tree, instance) {
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

    return expandTree(child, instance.children[i]);
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

  return expandTree(renderResult, instance.next);
}

function cleanup(instance) {
  if (instance.events && instance.element) {
    for (const [event, callback] of Object.entries(instance.events)) {
      instance.element.removeEventListener(event, callback);
    }
  }
}

function renderToDom(parent, tree, i) {
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
    const [element, props, instance] = tree;

    if (typeof element == 'string') {
      instance.element = instance.element || document.createElement(element);
      const el = instance.element;

      const { children = [], ...$props } = props;

      for (const [key, value] of Object.entries($props)) {
        // <button/> stuff
        if (key == 'onClick') {
          instance.events = instance.events || {};
          if (instance.events.click != null) {
            el.removeEventListener('click', instance.events.click);
          }

          instance.events.click = value;
          el.addEventListener('click', value);
          continue;
        }

        // <input/>

        if (key == 'type') {
          el.type = value;
          continue;
        }

        if (key == 'value') {
          el.value = value;
          continue;
        }

        if (key == 'checked') {
          el.checked = value;
          continue;
        }

        if (key == 'onChange') {
          instance.events = instance.events || {};
          if (instance.events.input != null) {
            el.removeEventListener('click', instance.events.input);
          }

          instance.events.input = value;
          el.addEventListener('input', value);
          continue;
        }

        throw new Error('Unsupported prop: ' + key);
      }

      for (let childIndex = 0; childIndex < children.length; childIndex += 1) {
        renderToDom(el, children[childIndex], childIndex);
      }

      insertToParent(parent, el, i);
      return;
    }
  }

  throw new Error(
    'toDom: Detected unknown tree: ' + JSON.stringify(tree, null, 2)
  );
}

export function useState(initial) {
  let i = hookIndex++;
  currentInstance.hooks = currentInstance.hooks || [];
  currentInstance.hooks[i] = currentInstance.hooks[i] || new State(initial);
  const state = currentInstance.hooks[i];
  return [state.get(), (newVal) => state.set(newVal)];
}
