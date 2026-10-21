# Toast 组件设计方案

> 状态:**P1 完成**(命令式 API、promise、自动/滑动关闭、多视口)
> 移植目标:Sonner 的 API 与交互(样式为本仓库自实现)
> 关联代码:`src/components/toast/`

## 1. 结构

```
toast (state/toast.ts)      # 命令式入口:toast()/success/error/promise/custom...
├── state/store.ts          # 唯一数据源:createToast / dismissToast / removeToast
├── state/promise-toast.ts  # loading → success/error 编排
└── Toaster (Toaster/)      # Portal + 按位置分视口
    └── ToastViewport       # 展开/收起、热键、可见条数
        └── Toast           # 单条:生命周期、滑动、关闭、图标/操作
```

## 2. SRP 分工

| 关注点 | 文件 |
| --- | --- |
| 类型契约 | `Toast/Toast.types.ts`、`Toaster/Toaster.types.ts` |
| 数据源与增删 | `state/store.ts` |
| 命令式 API | `state/toast.ts` |
| promise 编排 | `state/promise-toast.ts` |
| 视口选择/展开/热键 | `Toaster/useToaster.ts`、`ToastViewport.tsx` |
| 单条生命周期(自动关闭/退场) | `Toast/useToastLifecycle.ts` |
| 滑动关闭 | `Toast/Toast.tsx` + `Toast.utils.ts` |
| 展示部件 | `ToastContent/`、`ToastIcon/`、`ToastActions/`、`ToastCloseButton/` |

## 3. 状态模型

- 全局只有一个 `createStore<ToastT[]>`；`createToast` 是唯一写入入口。
- 同 id 再次调用：`Object.assign` 原地更新（`message` 缺省时保留原标题），不新增。
- 新 toast `unshift` 到队首，列表顺序天然为“新 → 旧”。
- `dismissToast` 只标记 `delete = true`；真正 `removeToast` 在退场动画结束后。
- `promise`：有 `loading` 时先建 loading；settle 后用同一 id 更新为 success/error；
  resolver 返回 `undefined` 表示“不留提示”，收起 loading。

## 4. 渲染与布局

- `Toaster` 默认 `bottom-right`，按 `position` 把 toast 分到不同视口；同一视口内只渲染
  `visibleToasts`（默认 3）条。
- `gap` 默认 14；`offset/mobileOffset` 控制视口边距；`expand` 初始展开。
- 热键默认 `Alt+T` 切换展开。
- `richColors` 给成功/错误着色；`icons` 可覆盖图标；`closeButton` 显示关闭按钮。
- `theme` 已弃用：主题由 `<html data-theme>` 决定。

## 5. 无障碍

- 每个位置一个 `<ol>` 视口（`data-slot="toaster-viewport"`），带 `aria-live="polite"`、
  `aria-relevant="additions text"`、`aria-atomic="false"`、`aria-label`（`containerAriaLabel` /
  `customAriaLabel`，默认 "Notifications"）；单条 Toast 是 `<li>`，没有额外的 `role="status"`。
- 关闭按钮有 `closeButtonAriaLabel`；纯图标操作必须由使用方提供 `aria-label`。
- 自动关闭时长可通过 `duration` 覆盖；`loading` 类 toast 不应自动关闭。

## 6. 后续

- 把 `Toaster` 的样式 token 化（当前含少量中性色硬编码）。
- 触摸滑动的方向/阈值可配置化（目前 `swipeDirections` 只控制方向集合）。
- dev 示例补全**滑动关闭**场景（promise / custom 已有示例；部件与状态测试见
  `tests/components/toast/`）。
