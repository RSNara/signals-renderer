
export function div(props) {
  return ['div', props];
}

export function h1(props) {
  return ['h1', props];
}

export function button(props) {
  return ['button', props];
}

export function custom(renderFn, props) {
  return [renderFn, props];
}

export function textInput(props) {
  return [
    'input',
    {
      type: 'text',
      ...props,
    },
  ];
}

export function checkbox(props) {
  return [
    'input',
    {
      type: 'checkbox',
      ...props,
    },
  ];
}
