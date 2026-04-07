import { createElement, render } from "./MiniReact";
import { useState } from "./MiniReact/render";

function Counter({ name }) {
    const [count, setCount] = useState(0);
    return (
        createElement(
            "div",
            { style: "display:flex;gap:5px;background:pink; padding:5px" },
            createElement("div", null, 'counter组件：'),
            createElement("button", {
                onClick: () => {
                    setCount(pre => pre + 1);
                    // setCount(count + 1);
                    // setCount(pre => pre + 1);
                }
            }, "增加"),
            createElement("p", null, `${name}:${count}`),
            createElement("button", { onClick: () => setCount(pre => pre - 1) }, "减少")
        )
    )
}

// function APP(props) {
//     const name = '当前值：'
//     return createElement(
//         "div",
//         { style: 'background: lightblue;padding:10px' },
//         props.name,
//         createElement(Counter, { name })
//     )
// }

const container = document.querySelector('#root');
const element = createElement(Counter, { name: 'APP组件' })
render(element, container);