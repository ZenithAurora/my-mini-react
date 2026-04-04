// 下一个要执行的任务
let nextUnitOfWork = null

// 执行任务
function performUnitOfWork() {
    // TODO
}

// 工作循环
function workLoop() {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)

        // 检查是否需要交出主线程
        shouldYield = deadline.timeRemaining() < 1
    }
    // 告诉浏览器，下一次你空闲了请继续执行我的工作循环
    requestIdleCallback(workLoop)
}


export function Scheduler(callback) {
    nextUnitOfWork = callback()
    workLoop()
}
