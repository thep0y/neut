# Neut 文档

本目录面向 **使用者** 与 **贡献者**，说明安装配置、组件 API、内部架构和扩展点。更细的组件实现取舍写在
各组件目录的 `DESIGN.md` 中；测试撰写规则见根目录 [TESTING.md](../TESTING.md)。

## 文档地图

| 文档 | 适合谁 | 内容 |
| :--- | :--- | :--- |
| [快速上手](./getting-started.md) | 使用者 | 安装、Tailwind v4、样式入口、主题 token、暗色模式、多语言字体 |
| [组件目录](./components.md) | 使用者 | 60 个组件的子部件、关键 props、`data-slot` 与相关文档入口 |
| [自研组件用法](./components/README.md) | 使用者 | shadcn 之外/行为较复杂的组件：API、受控用法、事件详情 |
| [架构说明](./architecture.md) | 贡献者 | 受控/非受控、事件详情、多态、样式与 `data-*` 约定、文件结构 |
| [定位器](./positioner.md) | 贡献者 | `~/lib/positioner` 的 middleware、自动更新、虚拟锚点 |
| [Hooks](./hooks.md) | 使用者/贡献者 | `useScrollLock`、`useScrollEdges`、`useFontLoader` |
| [Utils](./utils.md) | 使用者/贡献者 | `clsx`、`mergeRefs`、`callEventHandler`、事件详情、roving navigation 等 |
| [设计文档索引](#设计文档索引) | 贡献者 | 各组件 `DESIGN.md` 的分布 |

## 两条对齐目标

- **API 语义对齐 Base UI**：受控/非受控、`onXxxChange(value, details)`、`data-*` 状态属性、ARIA 角色。
- **使用方式对齐 shadcn/ui**：相同的组件名与组合方式、`data-slot` 命名、Tailwind 类名。

本项目不引入 `@radix-ui`、`@base-ui`、Kobalte 等组件库运行时；浮层定位、焦点管理、键盘导航均为自研。

## 设计文档索引

以下组件目录带 `DESIGN.md`（中文，记录状态、SRP 分工、行为取舍和与上游的差异）：

| 组件 | 文档 |
| :--- | :--- |
| Attachment | [src/components/attachment/DESIGN.md](../src/components/attachment/DESIGN.md) |
| Bubble | [src/components/bubble/DESIGN.md](../src/components/bubble/DESIGN.md) |
| Calendar | [src/components/calendar/DESIGN.md](../src/components/calendar/DESIGN.md) |
| Combobox | [src/components/combobox/DESIGN.md](../src/components/combobox/DESIGN.md) |
| ContextMenu | [src/components/context-menu/DESIGN.md](../src/components/context-menu/DESIGN.md) |
| DataTable | [src/components/data-table/DESIGN.md](../src/components/data-table/DESIGN.md) |
| Drawer | [src/components/drawer/DESIGN.md](../src/components/drawer/DESIGN.md) |
| DropdownMenu | [src/components/dropdown-menu/DESIGN.md](../src/components/dropdown-menu/DESIGN.md) |
| HoverCard | [src/components/hover-card/DESIGN.md](../src/components/hover-card/DESIGN.md) |
| Image | [src/components/image/DESIGN.md](../src/components/image/DESIGN.md) |
| Marker | [src/components/marker/DESIGN.md](../src/components/marker/DESIGN.md) |
| Message | [src/components/message/DESIGN.md](../src/components/message/DESIGN.md) |
| MessageScroller | [src/components/message-scroller/DESIGN.md](../src/components/message-scroller/DESIGN.md) |
| NumberInput | [src/components/number-input/DESIGN.md](../src/components/number-input/DESIGN.md) |
| Questionnaire | [src/components/questionnaire/DESIGN.md](../src/components/questionnaire/DESIGN.md) |
| Resizable | [src/components/resizable/DESIGN.md](../src/components/resizable/DESIGN.md) |
| ScrollArrows | [src/components/scroll-arrows/DESIGN.md](../src/components/scroll-arrows/DESIGN.md) |
| Select | [src/components/select/DESIGN.md](../src/components/select/DESIGN.md) |
| Sheet | [src/components/sheet/DESIGN.md](../src/components/sheet/DESIGN.md) |
| Tabs | [src/components/tabs/DESIGN.md](../src/components/tabs/DESIGN.md) |
| TimePicker | [src/components/time-picker/DESIGN.md](../src/components/time-picker/DESIGN.md) |
| Toast | [src/components/toast/DESIGN.md](../src/components/toast/DESIGN.md) |

## 文档维护约定

- **代码改动同步文档**：公开 API、`data-slot`、受控语义、默认值变化时，至少更新
  `docs/components.md`（或对应组件页）与组件目录的 `DESIGN.md`。
- **新增复杂组件**：在组件目录补 `DESIGN.md`，格式参考 [Tabs DESIGN](../src/components/tabs/DESIGN.md)：
  状态、移植目标、SRP 分工表、文件结构、行为与差异。
- **新增公开组件**：更新 `src/index.ts`、`docs/components.md`、`dev/routes.ts` 与测试，三处缺一不可。
- 文档里的命令一律用 **bun**，不要写 `npx` / `npm` / `pnpm`。
