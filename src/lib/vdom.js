function toProps(arg) {
  if (!arg) {
    return {};
  }
  if (Array.isArray(arg)) {
    return { children: arg };
  }
  return arg;
}

export function div(arg) {
  return ['div', toProps(arg)];
}

export function h1(arg) {
  return ['h1', toProps(arg)];
}

export function button(arg) {
  return ['button', toProps(arg)];
}

export function custom(renderFn, arg) {
  return [renderFn, toProps(arg)];
}

export const input = {
  text(arg) {
    return [
      'input',
      {
        type: 'text',
        ...toProps(arg),
      },
    ];
  },

  checkbox(arg) {
    return [
      'input',
      {
        type: 'checkbox',
        ...toProps(arg),
      },
    ];
  },
};

export function textInput(arg) {
  return [
    'input',
    {
      type: 'text',
      ...toProps(arg),
    },
  ];
}

export function checkbox(arg) {
  return [
    'input',
    {
      type: 'checkbox',
      ...toProps(arg),
    },
  ];
}
