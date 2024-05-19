import { Render, useState } from './renderer';

function Counter(props) {
  const { title, initialCount } = props;
  const [counter, setCounter] = useState(initialCount);
  const counterDisplay = `  ${counter}`;

  return div({
    children: [
      counter % 2 == 0 ? 'even' : null,
      button({
        children: [title],

        onClick: () => {
          console.log(counter);
          setCounter(counter + 1);
        },
      }),

      counterDisplay,
    ],
  });
}

function CounterPlayground() {
  const initialCount = 2;
  const [title, setTitle] = useState('Counter');

  return div({
    children: [
      h1({ children: ['Counter Playground'] }),
      custom(Counter, {
        title,
        initialCount,
      }),
      div({
        children: [
          'Set Button Text:',
          textInput({
            value: title,
            onChange: (el) => {
              setTitle(el.target.value);
            },
          }),
        ],
      }),
    ],
  });
}

function Todo() {
  const [todos, setTodos] = useState([]);
  const [todo, setTodo] = useState('');

  const input = div({
    children: [
      'Add todo: ',
      textInput({
        value: todo,
        onChange: (event) => {
          setTodo(event.target.value);
        },
      }),
      button({
        onClick: () => {
          setTodos([...todos, { checked: false, label: todo }]);
          setTodo('');
        },
        children: ['Press me!'],
      }),
    ],
  });

  function updateTodo(todo, update) {
    setTodos(
      todos.map((x) => {
        if (x != todo) {
          return x;
        }

        return {
          ...todo,
          ...update,
        };
      })
    );
  }

  return div({
    children: [
      input,
      ...todos.map((todo, i) =>
        div({
          children: [
            div({
              children: [
                checkbox({
                  checked: todo.checked,
                  onChange: (event) => {
                    updateTodo(todo, { checked: event.target.checked });
                  },
                }),
                todo.label,
              ],
            }),
          ],
        })
      ),
    ],
  });
}

console.clear();
Render(document.getElementById('app'), [Todo, {}]);

function div(props) {
  return ['div', props];
}

function h1(props) {
  return ['h1', props];
}

function button(props) {
  return ['button', props];
}

function custom(renderFn, props) {
  return [renderFn, props];
}

function textInput(props) {
  return [
    'input',
    {
      type: 'text',
      ...props,
    },
  ];
}

function checkbox(props) {
  return [
    'input',
    {
      type: 'checkbox',
      ...props,
    },
  ];
}
