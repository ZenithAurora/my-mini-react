import MiniReact from "./MiniReact";

const element = MiniReact.createElement(
    'div',
    { id: 'title', style: "background: pink; font-size:20px; padding: 10px" },
    MiniReact.createTextElement('react is powerful!'),
    MiniReact.createElement('div', { style: 'text-align: right;' }, '—MiniReact'),
)

const container = document.querySelector('#root');
MiniReact.render(element, container);