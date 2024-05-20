import { Render, useState } from "./lib/renderer";
import { default as CounterApp } from "./apps/CounterApp";
import { default as TodoApp } from "./apps/TodoApp";
import { div, button } from "./lib/vdom";

console.clear();

function AppSwitcher() {
  const [app, setApp] = useState("counter");

  return div({
    style: {
      display: "flex",
      flexDirection: "row",
    },
    children: [
      div({
        style: {
          flexGrow: "1",
          backgroundColor: "gray",
        },
        children: [
          button({
            onClick: () => {
              setApp("counter");
            },
            children: ["Counter"],
          }),
          button({
            onClick: () => {
              setApp("todo");
            },
            children: ["Todo"],
          }),
        ],
      }),
      div({
        style: {
          flexGrow: "3",
        },
        children: [
          app == "counter" ? [CounterApp, {}] : null,
          app == "todo" ? [TodoApp, {}] : null,
        ],
      }),
    ],
  });
}

Render(document.getElementById("app"), [AppSwitcher, {}]);
