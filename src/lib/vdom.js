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
  const props = toProps(arg);
  return [
    'h1',
    {
      ...props,
      style: {
        ...(props.style || {}),
        // TODO: Move this elsewhere!
        marginTop: 0,
      },
    },
  ];
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
