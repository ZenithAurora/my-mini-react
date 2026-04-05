import createDOM from './createDOM';


// 下一个要执行的任务（fiber）
let nextUnitOfWork = null
// 工作中的根节点
let workInProgressRoot = null

// 发出第一个fiber
// 调试用：控制台输入 printFiberTree() 即可查看完整 fiber 树（原生对象，可逐层展开）
function render(element, container) {
    // 这个就是root的fiber
    workInProgressRoot = {
        fiberName: 'root fiber', // 自己随便写的，方便在浏览器控制台调试的时候知道这是哪个fiber节点
        dom: container,
        props: {
            children: [element]
        },
        sibling: null,
        parent: null
    }

    nextUnitOfWork = workInProgressRoot
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
            fiberName: `${childrenElement.type} fiber`, // 自己随便写的，方便在浏览器控制台调试的时候知道这是哪个fiber节点
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
    if (fiber.child) {
        return fiber.child
    }
    let nextFiber = fiber
    while (nextFiber) {
        if (nextFiber.sibling) return nextFiber.sibling
        nextFiber = nextFiber.parent
    }
    // 如果循环结束都还是没有找到下一个工作单元，那么就会直接返回undefined，那么workLoop就会停止
    return undefined;
}

// -----------------------（同步）提交阶段----------------------

// 提交根Fiber
function commitRoot() {
    const now = performance.now()
    commitWork(workInProgressRoot.child)
    workInProgressRoot = null // 清空   
    console.log(`commit阶段耗时：${performance.now() - now}ms`);
}

// 从 fiber 开始提交
function commitWork(fiber) {
    if (!fiber) return;

    const parentDOM = fiber.parent.dom
    parentDOM.appendChild(fiber.dom)
    // 递归 child 和 sibling
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}
// --------------------------------------------------------------


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

    if (!nextUnitOfWork && workInProgressRoot) {
        commitRoot()
    }
}

// 第一次请求
requestIdleCallback(workLoop)






export default render;