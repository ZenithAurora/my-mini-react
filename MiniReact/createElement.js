/**
 * Element元素分为纯文本和对象，因此需要两个函数来处理
 *  - 1：createTextElement
 *  - 2：createElement
 */

// （1）创建纯文本元素
function createTextElement(text) {
    return {
        type: 'TEXT_ELEMENT',  // 写死
        props: {
            nodeValue: text,
            children: []
        },
    }
}

// （2）创建普通元素
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            // 某一个children元素是对象就直接用，否则创建纯文字节点
            children: children.map(child => {
                if (typeof child === "object") return child;
                else return createTextElement(child);
            })
        }
    }
}

export { createTextElement, createElement };
export default createElement;