import Scheduler from '../scheduler'


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
    // element.props.children.forEach(child => render(child, dom))
    /**
     * 【问题】：这个过程会递归下去，如果这颗DOM树很重，就会阻塞线程。
     * 因此 react自己封装了一个调度器 Scheduler
     * 这里我们用简单的requestIdleCallback来模拟这个调度过程
     */
    const task = () => element.props.children.forEach(child => render(child, dom))
    Scheduler(task)
    /**
     * 这个函数暂时无法运行，因为很多方法并没有具体实现，只是占位
     */



    // （4）追加到container中
    container.appendChild(dom)
}


export default render;