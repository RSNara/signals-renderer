import { Render, useState } from './lib/renderer';
import { default as CounterApp } from './apps/CounterApp';
import { default as TodoApp } from './apps/TodoApp';

console.clear();
Render(document.getElementById('app'), [TodoApp, {}]);
