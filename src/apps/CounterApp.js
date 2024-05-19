import { useState } from '../lib/renderer';
import {div, h1, button, custom, textInput, checkbox} from '../lib/vdom';

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
  
export default function App() {
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