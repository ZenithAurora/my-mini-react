import createDOM from './createDOM';

// --------------------------（1）全局引用---------------------------------
// 下一个要执行的任务（fiber）
let nextUnitOfWork = null
// 工作中的根节点
let workInProgressRoot = null
// 前一个完成的root
let currentRoot = null
// 记录要删除的fiber节点
let deletion = []
// ------------------------------------------------------------------



// --------------------------（2）render函数---------------------------------
function render(element, container) {
    // 这个就是root的fiber
    workInProgressRoot = {
        dom: container,
        props: { children: [element] },
        sibling: null,
        parent: null,
        child: null,
        alternate: currentRoot
    }

    nextUnitOfWork = workInProgressRoot
}
//-----------------------------------------------------------------------



// -----------------------（3）同步提交阶段-----------------------
// 提交根Fiber
function commitRoot() {
    // 对于收集到的删除Fiber，提交的时候统一删除
    deletion.forEach(commitWork)
    deletion = [] // 清空
    commitWork(workInProgressRoot.child)
    currentRoot = workInProgressRoot
    workInProgressRoot = null // 清空   
}

// 从 fiber 开始提交
function commitWork(fiber) {
    if (!fiber) return;

    const parentDOM = fiber.parent.dom

    // -------------------根据effectTag做不同的DOM操作-------------------
    // （1）如果是替换，则替换老的DOM节点
    if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
        parentDOM.appendChild(fiber.dom)
        // 对于新创建的节点，也需要注册事件监听器
        updateDOM(fiber.dom, {}, fiber.props)
    }
    // （2）如果是删除，则从DOM中删除
    else if (fiber.effectTag === 'DELETION' && fiber.dom) {
        parentDOM.removeChild(fiber.dom)
    }
    // （3）如果是更新，则单独处理
    else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
        updateDOM(fiber.dom, fiber.alternate.props, fiber.props)
    }
    // ----------------------------operation end--------------------------

    // 递归 child 和 sibling
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}
// --------------------------------------------------------------



// ---------------- （4）updateDOM ----------------
function updateDOM(dom, prevProps, nextProps) {
    /**
     * 举个例子
     *  prevProps = {id: 'a', className: 'red', onClick, children: []}
     *  nextProps = {className: 'blue', style: 'bold', onChange,children: []}
     * 
     * （1）删掉旧属性：id
     * （2）更新props：className, style
     */

    //-------------------【1】事件监听器处理🆕-------------------
    const isEvent = key => key.startsWith('on')               // 是否以on开头
    const getEventName = key => key.slice(2).toLowerCase()   // onClick -> click

    // [1] 移除旧的事件函数
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key => !(key in nextProps) || prevProps[key] !== nextProps[key])
        .forEach(key => {
            const eventName = getEventName(key)
            dom.removeEventListener(eventName, prevProps[key])
        })

    // [2] 添加新的事件函数
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(key => !(key in prevProps) || prevProps[key] !== nextProps[key])
        .forEach(key => {
            const eventName = getEventName(key)
            dom.addEventListener(eventName, nextProps[key])
        })
    //-------------------🆕事件监听器处理end🆕-----------------



    // -------------------【2】属性（非事件函数）-------------------

    // （1）对老Props：删掉那些旧的属性（child除外）
    Object.keys(prevProps)
        .filter(key => key !== 'children')     // ① → {id, className}
        .filter(key => !(key in nextProps))      // ② → {id}
        .forEach(key => delete dom[key])       // ③ → 删除id属性

    // （2）赋予dom新的Props或者改变的Props
    Object.keys(nextProps)
        .filter(key => key !== 'children')                                         // ① → {className, style}
        .filter(key => !(key in prevProps) || prevProps[key] !== nextProps[key])     // ② → {className，style}
        .forEach(key => dom[key] = nextProps[key])                                 // ③ → red更新为blue，新增style
}
// ---------------------------------------------------------------



// ---------------------------（5）reconcile函数--------------------------------
function reconcileChildren(wipFiber, elements) {
    // wipFiber == workInProgressFiber
    let index = 0
    let prevSibling = null
    // 这里需要判断一下alternate是否存在，因为初始阶段wipFiber.alternate(旧Fiber)为null
    let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null

    while (index < elements.length || oldFiber != null) {
        const element = elements[index]
        // 两颗DOM一样：新元素存在 并且 老元素也存在 并且 新元素的type跟老元素的type一样
        const sameType = element && oldFiber && element.type === oldFiber.type
        let newFiber = null

        // ---------------针对 更新、新建、删除三种情况分别处理---------------
        // （1）更新：类型一样
        if (sameType) {
            newFiber = {
                type: oldFiber.type,
                props: element.props,   //👈== 类型一样，直接用新元素的props就行
                dom: oldFiber.dom,      //👈== 复用老 dom
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: 'UPDATE',    //👈== 标记为更新
            }
        }

        // （2）新建：新元素存在 老元素不存在
        if (!sameType && element) {
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,              //👈== 新建的，所以还没有DOM
                parent: wipFiber,
                alternate: null,        //👈== 没有老Fiber，所以为null
                effectTag: 'PLACEMENT', //👈== 标记为新建
            }
        }

        // （3）删除：老元素存在 新元素不存在
        if (!sameType && oldFiber) {
            oldFiber.effectTag = 'DELETION' //👈 标记为删除
            deletion.push(oldFiber)         //👈 收集待删除的Fiber（后续Commit阶段处理）
        }
        // ------------------------------end----------------------------

        // 将performUnitOfWork中建立fiber之间链条的逻辑写道这里来
        if (index === 0) wipFiber.child = newFiber // 第一个为children
        else prevSibling.sibling = newFiber        // 后续为sibling

        // 更新状态
        if (oldFiber) oldFiber = oldFiber.sibling
        prevSibling = newFiber
        index++
    }
}
// ----------------------------------------------------------------------------




//----------------（6）performUnitOfWork执行工作单元----------------
/**
 * 执行任务: TODO 3 things
 * 1. add the element to the DOM
 * 2. create the fibers for the element’s children
 * 3. select the next unit of work
 */
function performUnitOfWork(fiber) {
    // ==================== 1.创建DOM并记录到当前fiber节点中 ====================
    if (!fiber.dom) {
        fiber.dom = createDOM(fiber)
    }
    // 追加到父节点
    // if (fiber.parent) fiber.parent.dom.appendChild(fiber.dom)

    // ==================== 2.创建子级Fiber以及建立关系 ====================
    const elements = fiber.props.children
    reconcileChildren(fiber, elements)

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
// ---------------------------------------------------------------------



// -------------------------- （7）工作循环 ----------------------------
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
// ---------------------------------------------------------------



export default render;