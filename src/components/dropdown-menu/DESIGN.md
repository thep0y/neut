# DropdownMenu 组件设计方案

> 状态:**已实现**
> 移植目标:**shadcn Base UI 版 `dropdown-menu`**(`ui.shadcn.com/docs/components/base/dropdown-menu`)
> 关联代码:`src/components/dropdown-menu/`

## 1. 概述

Base UI 里 `Menu`(DropdownMenu)与 `ContextMenu` 共用同一套菜单机制。本仓库的
`context-menu` 已经实现了完整运行时:定位、菜单项注册表、键盘导航、typeahead、
子菜单联动、checkbox/radio 项。因此 DropdownMenu **直接复用这套运行时**,只提供
自己的根状态与触发器:

| 复用的内部 | 来源 |
| --- | --- |
| 浮层运行时 `createContextMenuPopupRuntime` | `context-menu/ContextMenuContent/useContextMenuContent.ts` |
| 展示骨架 `ContextMenuPopupSurface` | `context-menu/ContextMenuContent/ContextMenuPopupSurface.tsx` |
| 菜单项注册/高亮 `useContextMenuEntry` | `context-menu/context-menu.entry.ts` |
| popup / submenu / radio / group context | `context-menu/context-menu.context.ts` |
| 事件详情、定位工具 | `context-menu/context-menu.utils.ts` |
| 子菜单状态容器 `ContextMenuSub` | `context-menu/ContextMenuSub` |

交互模型与 context-menu 一致:焦点落在 popup 上,高亮项用 `aria-activedescendant`
+ `data-highlighted` 表达(而不是把焦点在项之间搬)。

## 2. 与 ContextMenu 的差异

- 锚点是**触发器元素**(不是鼠标坐标):`DropdownMenuContent` 把
  `reference` 设为 `root.trigger`。
- 打开方式:点击 / Enter / Space / ↑ / ↓(trigger 用 `addEventListener`,不覆盖用户 onClick)。
- 不受"再次右键"影响;点击触发器切换开关,点击菜单与触发器之外关闭。
- `data-slot` 使用 `dropdown-menu-*`;视觉类名对齐 shadcn base 版 dropdown-menu
  (`rounded-md px-1.5 py-1` 等,与 context-menu 略有差异)。

## 3. 组成

`DropdownMenu` / `DropdownMenuTrigger` / `DropdownMenuPortal` / `DropdownMenuContent` /
`DropdownMenuGroup` / `DropdownMenuLabel` / `DropdownMenuItem` / `DropdownMenuCheckboxItem` /
`DropdownMenuRadioGroup` / `DropdownMenuRadioItem` / `DropdownMenuSeparator` /
`DropdownMenuShortcut` / `DropdownMenuSub` / `DropdownMenuSubTrigger` / `DropdownMenuSubContent`

## 4. 无障碍

- Trigger:`aria-haspopup="menu"`、`aria-expanded`、`aria-controls`、`data-state`。
- Content:`role="menu"`、`tabindex="-1"`、`aria-activedescendant`(由共享表面提供)。
- Item:`role="menuitem"` / `menuitemcheckbox` / `menuitemradio`、`aria-disabled`、
  `data-highlighted`;纯图标触发器/项需使用方提供 `aria-label`。

## 5. 后续待实现

- **抽出共享 `menu/` 核心**:现在 dropdown-menu 依赖 context-menu 的内部文件(复用了
  运行时,但耦合在 `context-menu/*`)。理想是提取 `src/components/menu/`(运行时 +
  注册表 + 键盘 + 表面),ContextMenu 与 DropdownMenu 都基于它,消除跨组件内部依赖。
- `modal` 的完整语义(焦点陷阱 / 背景 inert),目前与 context-menu 一致,只锁滚动。
- DropdownMenuContent 的**锚点宽度对齐**(shadcn 的 `w-(--anchor-width)`):需要
  positioner 增加 matchWidth 中间件。
- 长按重复、`DropdownMenuCheckboxItem` 的 indeterminate 等细节。
- dev 示例补全 + 交互/单测走查。
