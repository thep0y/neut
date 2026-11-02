# Select 组件设计方案

> 状态:**P1 完成**(受控/非受控、键盘、ARIA、选中项对齐、滚动锁定)
> 移植目标:Base UI `Select` + shadcn 的样式与 `data-slot`
> 关联代码:`src/components/select/`

## 1. 结构

```
Select                 # 根:value/open/disabled + 选项注册表 + context
├── SelectTrigger      # 默认 Button;role=combobox;ChevronDown
├── SelectValue        # 已选项 label / placeholder
└── SelectContent      # Portal;外层定位 + 内层 listbox(常驻挂载)
    ├── SelectItem     # role=option
    └── SelectGroup / Label / Separator
```

## 2. SRP 分工

| 关注点                       | 文件                                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| 类型契约                     | `Select/Select.types.ts`                                           |
| 根状态与选项注册表           | `Select/Select.tsx`                                                |
| context + `useSelectContext` | `Select/Select.context.ts`                                         |
| Trigger 交互                 | `SelectTrigger/useSelectTrigger.ts`                                |
| 浮层定位/可见性/关闭         | `SelectContent/useSelectContent.ts`、`SelectContent.utils.ts`      |
| 选项交互                     | `SelectItem/useSelectItem.ts`                                      |
| 展示部件                     | `SelectValue/`、`SelectGroup/`、`SelectLabel/`、`SelectSeparator/` |

## 3. 值模型

- `value === undefined` = 非受控；`null` = 受控清空。
- 每个 `SelectItem` 在 `onMount` 注册 `{ value, label, disabled }`，卸载注销；
  `SelectValue` 从注册表里取 label（取不到时回退 value）。
- `SelectContent` 关闭时**不卸载子节点**，只用 `visibility/pointer-events` 隐藏：
  否则 item 注销会让已选值失去 label。
- `onValueChange` 只回调值，没有事件详情（与 Combobox 不同）。

## 4. 定位：选中项对齐

- 未选中时：按 `placement`（默认 `bottom-start`）贴 trigger。
- 已选中时：进入“选中项对齐”——计算选中项在列表中的 offsetTop，让该项盖在 trigger 上。
  这样长列表里打开面板时选中项一定可见。
- 因此没有 `side`/`align` 两个独立 prop；`SelectContent` 用 `placement`。
- 管线：positioner（offset/flip/shift/matchWidth/size）+ 滚动箭头。

## 5. 交互与无障碍

- Trigger：`role="combobox"`、`aria-haspopup="listbox"`、`aria-expanded`、`aria-controls`。
- Content：`role="listbox"`；键盘事件挂在 document 上（打开时），不抢焦点：
  ↑↓ 移动 `activeValue`，Enter/Space 选择，Escape 关闭，Tab 关闭。
- `SelectItem`：`role="option"`、`aria-selected`、`aria-disabled`、`data-value`；
  高亮用样式类（未使用 `aria-activedescendant`，这是与菜单/时间列不同的地方）。
- 点击外部在**捕获阶段**监听并 `stopPropagation`，避免点击穿透到浮层下的元素。
- `lockScroll` 默认 true；放行 `[data-slot="select-content"]` 内部滚动。

## 6. 后续

- 与菜单统一高亮模型（`aria-activedescendant`），并补 typeahead。
- `SelectContent` 的进退场动画（当前只有入场）。
- 分组 label 与 `aria-labelledby` 的显式关联。
