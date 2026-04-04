import MiniReact from "./MiniReact";

const element = MiniReact.createElement(
    'h1',
    { className: 'title', style: "background:red" },
    'Hello World',
    MiniReact.createElement('div', { style: "background:blue;" }, '—MiniReact')
)

const container = document.querySelector('#root');
MiniReact.render(element, container);
