function createDOM(fiber) {
    // （1）创造节点
    const dom =
        fiber.type === 'TEXT_ELEMENT'
            ? document.createTextNode(fiber.props.nodeValue)
            : document.createElement(fiber.type)

    //（2）赋值属性
    const keys = Object.keys(fiber.props).filter(key => key !== 'children')
    keys.forEach(key => dom[key] = fiber.props[key])

    // （3）返回DOM
    return dom;
}


export default createDOM;