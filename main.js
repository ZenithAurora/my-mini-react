import MiniReact from "./MiniReact";

const element = MiniReact.createElement(
    'h1',
    { id: 'title', style: "background:red" },
    MiniReact.createTextElement('Hello World'),
    MiniReact.createElement('div', { id: 'name', style: "background:blue;" }, '—MiniReact')
)

const container = document.querySelector('#root');
MiniReact.render(element, container);
