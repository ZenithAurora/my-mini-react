function render(element, container) {
    // （1）节点
    const dom =
        element.type === 'TEXT_ELEMENT'
            ? document.createTextNode(element.props.nodeValue)
            : document.createElement(element.type)

    //（2）属性
    const keys = Object.keys(element.props).filter(key => key !== 'children')
    keys.forEach(key => dom[key] = element.props[key])

    // （3）子节点
    element.props.children.forEach(child => render(child, dom))

    // （4）追加到container中
    container.appendChild(dom)
}


export default render;