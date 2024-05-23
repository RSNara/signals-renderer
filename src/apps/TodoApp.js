import { useState } from '../lib/renderer';
import { div, h1, button, custom, input } from '../lib/vdom';

function Todo() {
  const [todos, setTodos] = useState([]);
  const [todo, setTodo] = useState('');

  const inputAddTodo = div([
    'Add todo: ',
    input.text({
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
    inputAddTodo,
    ...todos.map((todo, i) =>
      div([
        div([
          input.checkbox({
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
