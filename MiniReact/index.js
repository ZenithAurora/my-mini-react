import { createElement, createTextElement } from "./createElement";
import render from "./render/render3.0";
import createDom from "./createDom";


const MiniReact = {
    createTextElement,
    createElement,
    createDom,
    render,
}



export { createElement, render, createDom, createTextElement };
export default MiniReact;