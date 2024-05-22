import { useState } from '../lib/renderer';
import { div, h1, button, custom, textInput, checkbox } from '../lib/vdom';

function Todo() {
  const [todos, setTodos] = useState([]);
  const [todo, setTodo] = useState('');

  const input = div([
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
  ]);

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
      }),
    );
  }

  return div([
    input,
    ...todos.map((todo, i) =>
      div([
        div([
          checkbox({
            checked: todo.checked,
            onChange: (event) => {
              updateTodo(todo, { checked: event.target.checked });
            },
          }),
          todo.label,
        ]),
      ]),
    ),
  ]);
}

export default function App() {
  return div([h1(['Todo App']), custom(Todo)]);
}
