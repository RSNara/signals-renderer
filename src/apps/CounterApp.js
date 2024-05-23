import { useState } from '../lib/renderer';
import { div, h1, button, custom } from '../lib/vdom';

function Counter(props) {
  const { startAt } = props;
  const [counter, setCounter] = useState(startAt);
  const space = ' '.repeat(5);

  const isItEven = div(['Is it even: ', counter % 2 == 0 ? 'yes' : 'no']);

  return div([
    isItEven,
    button({
      children: ['Increment'],
      onClick: () => {
        console.log(counter);
        setCounter(counter + 1);
      },
    }),
    space,
    String(counter),
  ]);
}

export default function App() {
  return div([h1(['Counter App']), custom(Counter, { startAt: 20 })]);
}
