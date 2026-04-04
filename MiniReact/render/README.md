# Render 渐进式演进

本目录包含三个版本的 `render` 实现，它们展示了 **React 渲染机制从简单递归到 Fiber 架构的完整演化过程**。每个版本解决上一个版本的核心问题，由简入深，逐步逼近 React 的真实设计。

---

## 版本总览

| 文件 | 核心思路 | 解决的问题 | 引入的新概念 |
|------|---------|-----------|-------------|
| `render.js` | 递归遍历，同步渲染 | 完成最基本的 DOM 创建与挂载 | 无（纯递归） |
| `render2.0.js` | 引入调度器思想 | 识别"递归会阻塞主线程"的问题 | Scheduler 调度器 |
| `render3.0.js` | Fiber 架构 + 可中断渲染 | 用链表树替代递归，实现真正的可中断/恢复 | Fiber、Work Loop、Unit of Work |

---

## 第一版：`render.js` —— 同步递归，简单直接

### 做了什么

```js
function render(element, container) {
    // 1. 创建 DOM 节点
    const dom = element.type === 'TEXT_ELEMENT'
        ? document.createTextNode(element.props.nodeValue)
        : document.createElement(element.type)

    // 2. 设置属性
    Object.keys(element.props)
        .filter(key => key !== 'children')
        .forEach(key => dom[key] = element.props[key])

    // 3. 递归渲染子节点 ← 关键：这里是递归调用
    element.props.children.forEach(child => render(child, dom))

    // 4. 挂载到父容器
    container.appendChild(dom)
}
```

### 特点

- **逻辑清晰**：创建节点 → 设属性 → 递归子节点 → 挂载，一气呵成
- **代码量少**：不到 20 行就能完成渲染
- **同步阻塞**：递归一旦开始就必须执行完毕，中间无法打断

### 问题在哪？

**递归 = 调用栈深度绑定 DOM 树深度。** 当组件树很深或很庞大时：

1. **长时间占用主线程** → 页面卡顿、用户输入无响应
2. **无法中断** → 浏览器没有机会处理高优先级任务（如用户点击、动画）
3. **无法恢复** — 一旦开始就只能跑完，没有"暂停"和"继续"的概念

> 这就是 React 15 及之前版本面临的核心问题。大型应用的渲染会导致明显的掉帧。

---

## 第二版：`render2.0.js` —— 引入调度器，发现问题

### 做了什么

在第一版的基础上，将子节点的递归调用**外包给调度器**：

```js
// 第一版：直接递归
element.props.children.forEach(child => render(child, dom))

// 第二版：交给调度器
const task = () => element.props.children.forEach(child => render(child, dom))
Scheduler(task)
```

### 思路转变

这一版的核心价值不在于代码能跑通，而在于**明确指出了问题所在**：

> 递归渲染会阻塞主线程 → 需要一个调度器来管理渲染任务的执行时机

它引入了 `Scheduler`（调度器）的概念——让浏览器在**空闲时**才去执行渲染任务，而不是一股脑全部塞进去。

### 局限性

虽然引入了调度器的想法，但**本质上仍然是递归结构**。调度器只能控制"什么时候开始递归"，却无法控制"递归到一半时暂停"。要真正实现可中断渲染，需要更根本的数据结构改造。

> 这一版是一个**过渡性的思考实验**，为第三版的 Fiber 架构做铺垫。

---

## 第三版：`render3.0.js` —— Fiber 架构，可中断渲染

### 做了什么

彻底抛弃递归，改用 **Fiber 链表树 + 工作循环（Work Loop）** 来驱动渲染：

#### （1）不再递归，而是创建 Fiber 树

```js
function render(element, container) {
    // 不再调用 render(child, dom)，而是创建第一个 fiber 节点
    nextUnitOfWork = {
        dom: container,
        props: { children: [element] },
        sibling: null,
        parent: null
    }
}
```

#### （2）每个 Fiber 是一个工作单元（Unit of Work）

```js
function performUnitOfWork(fiber) {
    // 第一步：创建当前 fiber 对应的真实 DOM，并挂载到父节点
    if (!fiber.dom) {
        fiber.dom = createDOM(fiber)
    }
    if (fiber.parent) {
        fiber.parent.dom.appendChild(fiber.dom)
    }

    // 第二步：将子元素转化为 fiber 节点，建立 child / sibling 关系
    for (let childrenElement of elements) {
        const newFiber = { type, props, parent: fiber, ... }
        if (!fiber.child) {
            fiber.child = newFiber       // 第一个孩子是 child
        } else {
            prevSibling.sibling = newFiber // 后续孩子是 sibling
        }
        prevSibling = newFiber
    }

    // 第三步：返回下一个要处理的 fiber（child → sibling → uncle...）
    if (fiber.child) return fiber.child
    // ... 沿 sibling 向上回溯
}
```

#### （3）工作循环：利用浏览器空闲时间片段执行

```js
function workLoop(deadLine) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        shouldYield = deadLine.timeRemaining() < 1  // 时间不够就暂停
    }
    requestIdleCallback(workLoop)  // 浏览器空闲时继续
}
```

### Fiber 数据结构

每个 Fiber 节点是一个普通 JavaScript 对象，通过指针形成一棵链表树：

```
fiber = {
    type: 'div',          // 元素类型
    props: { ... },       // 元素属性
    dom: divNode || null, // 对应的真实 DOM（可能还未创建）
    parent: fiber,        // 父节点
    child: fiber,         // 第一个子节点
    sibling: fiber,       // 下一个兄弟节点
}
```

树的结构大致如下（以 `<div><a></a><span></span></div>` 为例）：

```
root (container)
 └── div (child)
      ├── a (div.child)     ← 第一个孩子
      │    └── sibling → span  ← 兄弟链
```

### 为什么 Fiber 能解决递归的问题？

| | 递归（第一版） | Fiber（第三版） |
|--|--------------|----------------|
| **遍历方式** | 函数调用栈（系统管理） | while 循环 + 指针（自己管理） |
| **能否中断** | 不能，必须跑完完整调用栈 | 可以，每次循环检查剩余时间 |
| **能否恢复** | 不能，上下文在调用栈中 | 可以，`nextUnitOfWork` 记录进度 |
| **主线程阻塞** | 树多大就阻塞多久 | 每帧只做一点点，分多帧完成 |

**核心区别：递归的控制权在 JavaScript 引擎的调用栈里，你拿不回来；Fiber 把控制权拿到了自己手里，用 `nextUnitOfWork` 一个变量就能记住"我做到哪了"，随时可以停、随时可以继续。**

这就是 React 16 引入 Fiber 架构的根本原因。

---

## 演进路线图

```
render.js          render2.0.js           render3.0.js
   │                  │                       │
   ▼                  ▼                       ▼
 同步递归          发现问题                 彻底重构
   │            (递归阻塞主线程)         (Fiber + WorkLoop)
   │                  │                       │
   │                  ▼                       ▼
   │            引入 Scheduler          可中断 / 可恢复
   │            (思想铺垫)              浏览器空闲时渲染
   │                                          │
   └──────────────────┴───────────────────────┘
                    渐进式理解 React 渲染核心
```

三个版本不是彼此替代的关系，而是一堂**分层教学课**：
1. 先看懂最简单的递归渲染（建立直觉）
2. 再理解为什么递归不行（发现瓶颈）
3. 最后看 Fiber 如何从根本上解决问题（掌握本质）
