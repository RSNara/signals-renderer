import { Render, useState } from './lib/renderer';
import { default as CounterApp } from './apps/CounterApp';
import { default as TodoApp } from './apps/TodoApp';
import { div, button } from './lib/vdom';

console.clear();

function AppSwitcher() {
  const [app, setApp] = useState('todo');

  const navBar = div({
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: '10em',
      paddingRight: '1em',
    },
    children: [
      button({
        style: {
          boxShadow: app == 'counter' ? '0.1em 0.1em 0.5em black' : 'none',
        },
        onClick: () => {
          setApp('counter');
        },
        children: ['Counter'],
      }),
      button({
        style: {
          boxShadow: app == 'todo' ? '0.1em 0.1em 0.5em black' : 'none',
        },
        onClick: () => {
          setApp('todo');
        },
        children: ['Todo'],
      }),
    ],
  });

  const appScreen = div({
    style: {
      flexGrow: '1',
    },
    children: [
      app == 'counter' ? [CounterApp, {}] : null,
      app == 'todo' ? [TodoApp, {}] : null,
    ],
  });

  return div({
    style: {
      display: 'flex',
      flexDirection: 'row',
      paddingTop: '1.5em',
    },
    children: [navBar, appScreen],
  });
}

Render(document.getElementById('app'), [AppSwitcher, {}]);
