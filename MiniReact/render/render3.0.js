import createDOM from '../createDom'


// 下一个要执行的任务（fiber）
let nextUnitOfWork = null

// 发出第一个fiber
function render(element, container) {
    // 这个就是root的fiber
    nextUnitOfWork = {
        dom: container,
        props: {
            children: [element]
        },
        sibling: null,
        parent: null
    }
}

/**
 * 执行任务: TODO 3 things
 * 1. add the element to the DOM
 * 2. create the fibers for the element’s children
 * 3. select the next unit of work
 */
function performUnitOfWork(fiber) {
    /**
     * 第一次的时候，进来的fiber是 root 的fiber
     * fiber = {
     *  dom: container,
     *  props: { children: [h1] },
     *  sibling: null,
     *  parent: null
     * }
     * 
     * <div class="root">
     *   <h1>
     *     hello world
     *     <div>—MiniReact</div>
     *   </h1>
     * </div>
     *
     */


    // ==================== 1.创建DOM并记录到当前fiber节点中 ====================
    if (!fiber.dom) {
        fiber.dom = createDOM(fiber)
    }
    // 追加到父节点
    if (fiber.parent) {
        fiber.parent.dom.appendChild(fiber.dom)
    }

    // ==================== 2.创建子级Fiber以及建立关系 ====================
    const elements = fiber.props.children
    let prevSibling = null

    // 把每一个孩子元素，弄成一个fiber
    // 构建fiber之间的关系
    for (let childrenElement of elements) {
        const newFiber = {
            type: childrenElement.type,
            props: childrenElement.props,
            parent: fiber, // 新造出来的这个fiber直接连到父亲身上
            child: null,
            dom: null,
            sibling: null
        }

        // 最开始没有孩子，所以这个新的fiber就是太子
        // fiber只认太子
        // 至于fiber的二儿子，那么直接认太子当兄弟（等级森严）
        // 同样，对于三儿子，只认二儿子当兄弟
        if (!fiber.child) {
            fiber.child = newFiber
        } else {
            prevSibling.sibling = newFiber
        }
        prevSibling = newFiber // 记录上一个哥哥是谁
    }


    // ==================== 3. 返回下一个工作单元（fiber） =====================
    if (fiber.child) return fiber.child
    let nextFiber = fiber
    while (nextFiber) {
        if (nextFiber.sibling) return nextFiber.sibling
        nextFiber = nextFiber.parent
    }
    // 如果循环结束都还是没有找到下一个工作单元，那么就会直接返回undefined，那么workLoop就会停止
    return undefined;
}


// 工作循环
// 这个deadLine是requestIdleCallback给的
function workLoop(deadLine) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)

        // 检查是否需要交出主线程
        shouldYield = deadLine.timeRemaining() < 1
    }
    // 告诉浏览器，下一次你空闲了请继续执行我的工作循环
    requestIdleCallback(workLoop)
}

// 第一次请求
requestIdleCallback(workLoop)


export default render;