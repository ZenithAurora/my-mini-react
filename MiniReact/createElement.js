// 纯文字节点
function createTextElement(text) {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: []
        },
    }
}



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



export default createElement;