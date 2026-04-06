import { createElement, render } from "./MiniReact";

function APP(props) {
    return createElement(
        "div",
        null,
        "Hi ",
        props.name // 这个实际上是 <h1> 的 child
    )
}

const container = document.querySelector('#root');
/**
 * 这里跟着 pomb 做，他将这个函数直接传递给了 createElement(type,props,...children)
 * 这就意味着，后续的这个fiber节点的type
 *  1. fiber.type就直接为 APP 函数
 *  2. type都为函数了，那么我们就不能根据type来创造dom了，因此这个额fiber也没有dom节点
 */
const element = createElement(APP, { name: 'foo' })
render(element, container);