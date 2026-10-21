# Combobox 组件设计方案

> 状态:**P1 完成**(单选/多选/搜索/分组/键盘/ARIA/滚动锁定)
> 移植目标:shadcn Base UI 版 `combobox`
> 关联代码:`src/components/combobox/`
> 依赖声明:上游行为来自 Base UI 的 Combobox 原语;本仓库不引入该运行时,复用自研 positioner。

## 1. 概述

```
Combobox                     # headless 根:items / value / open / filter / activeIndex
├── ComboboxInput           # InputGroup + 输入框(+ Clear)
│   └── ComboboxTrigger     # 箭头按钮
├── ComboboxContent         # Portal + positioner
│   └── ComboboxList        # role=listbox + ScrollArrows
│       ├── ComboboxGroup / ComboboxLabel
│       └── ComboboxItem    # role=option
└── ComboboxChips ...       # 多选形态
```

根组件不渲染 DOM，只提供 context；`Combobox` 的 `reference` 由 `ComboboxInput` 或
`ComboboxChips` 的 ref 设置，`floating` 由 `ComboboxContent` 设置。

## 2. SRP 分工

| 关注点 | 文件 |
| --- | --- |
| 类型契约 | `Combobox/Combobox.types.ts` |
| 根状态(值/开合/过滤/高亮/锚点/id) | `Combobox/Combobox.tsx` |
| context + `useComboboxContext` | `Combobox/Combobox.context.ts` |
| 输入框与键盘 | `ComboboxInput/ComboboxInput.tsx` |
| 浮层定位与开合 | `ComboboxContent/ComboboxContent.tsx` |
| listbox 与滚动箭头 | `ComboboxList/ComboboxList.tsx` |
| 选项/分组/空态 | `ComboboxItem/`、`ComboboxGroup/`、`ComboboxLabel/`、`ComboboxEmpty/` |
| 多选 chip | `ComboboxChips/`、`ComboboxChip/`、`ComboboxChipsInput/` |
| 集合渲染(可选，带本地过滤) | `ComboboxCollection/ComboboxCollection.tsx` |

## 3. 状态模型

- **受控/非受控**：`value !== undefined` 即受控；`open !== undefined` 即受控。
- **先回调再落状态**：`onValueChange` / `onOpenChange` 的 details 里调用 `cancel()` 会阻止提交；
  `selectItem` 在被 cancel 时也不会回填输入框或关闭面板。
- **过滤**：`filterValue` 与 `itemToStringValue` 做大小写不敏感的 includes 匹配；无查询时返回全部。
- **分组**：`isGrouped()` 检测 items 里是否出现 `{ items: T[] }` 形态；分组时 `ComboboxList`
  渲染整组，`ComboboxCollection` 自己做组内过滤。
- **空态**：`ComboboxEmpty` 的类名里目前写死了 `hidden`，没有“有结果就隐藏/无结果就显示”的接线；
  需要空态时由调用方覆盖 `class`（这是一处待修的实现细节，不是使用方配置错误）。
- **高亮**：`activeIndex` 指向 `filteredItems` 的下标；`optionId` 由 `listId + value` 派生，
  供输入框的 `aria-activedescendant` 使用。
- **多选**：`selectItem` 在已选中时移除、否则追加；单选择回填并关闭。
- **滚动锁定**：`open() && lockScroll()` 时调用共享 `useScrollLock`，放行
  `[data-slot="combobox-content"]` 内部滚动。

## 4. 键盘与 ARIA

- 输入框：`role="combobox"`、`aria-expanded`、`aria-controls`（listbox id）、
  `aria-activedescendant`（高亮项 id）。
- `ArrowDown` / `ArrowUp` 打开并循环；`Home`/`End` 跳首尾；`Enter` 选择；`Escape` 关闭。
- `ComboboxItem` 是 `role="option"` + `aria-selected`；高亮/悬停用 `data-highlighted`，
  不移动真实焦点。
- 点击外部关闭；`ComboboxContent` 的定位沿用 positioner 的 offset/flip/shift。

## 5. 与上游的差异

- `autoHighlight` 目前只在 `ComboboxProps` 里声明，根状态没有消费它（`activeIndex` 初始为 -1）；
  需要“打开即高亮首项”时应由调用方/后续实现接线，不能依赖该 prop。
- 上游用 `render` / `UseRenderComponentProps`；本仓库用 `component` 多态。
- 上游的过滤/分组能力更全（自定义 filter、异步 items）；本仓库目前是同步 includes 过滤。
- 上游有 `inputValue` 受控、`onInputValueChange`、`filter` 回调；本仓库尚未导出。
- 未实现虚拟化；`ComboboxList` 用 `max-h-72` + 原生滚动。
