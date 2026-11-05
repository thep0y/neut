# 架构说明

本文记录跨组件的统一约定。实现细节与取舍写在组件目录的 `DESIGN.md`。

## 1. 目标与非目标

**目标**

- 用 SolidJS 从零实现 shadcn/ui 的组件形态与组合方式。
- 语义尽量对齐 Base UI：受控/非受控、`onXxxChange` 的事件详情、`data-*` 状态、ARIA。
- 组件源码是可交付物：按目录复制即可使用，不依赖上游组件运行时。

**非目标**

- 不追求与 shadcn 逐像素一致；主题 token 层未完整移植，部分间距/圆角可能不同。
- 不引入 `@radix-ui` / `@base-ui` / Kobalte / TanStack 等运行时。

## 2. 目录与职责

```
src/
├── components/<name>/           # 一个组件一个目录（kebab-case）
│   ├── <Name>/                  # 根状态组件（Context + Provider）
│   ├── <SubComponent>/          # 子部件，各自 index.ts / tsx / types
│   ├── <name>.types.ts          # 跨部件共享类型
│   ├── <name>.utils.ts          # 共享纯函数
│   └── DESIGN.md                # 复杂组件的设计文档（中文）
├── lib/index.ts                 # 兼容出口：re-export @neut/positioner
├── types/                       # BaseProps / PolymorphicProps 等
├── utils/                       # clsx / mergeRefs / 事件详情 / roving navigation
├── hooks/                       # 跨组件 hooks
└── styles/                      # Tailwind 入口、动画、i18n 字体

packages/
└── positioner/                  # 自研浮层定位（private workspace 包）
    ├── src/
    └── tests/
```

单文件只承担一件事：**渲染 / 状态 / 交互算法 / ARIA 语义** 解耦。交互算法尽量抽成可独立单测的函数或
hook（如 `Tabs/useTabsKeyboard.ts`、`MessageScroller` 的多个 `message-scroller.*.ts`）。

## 3. 受控 / 非受控

统一模式：**`props.value !== undefined` 即受控**。受控时只回调、不写内部状态；非受控时写内部信号并照常回调。

```tsx
const [internal, setInternal] = createSignal(defaultValue);
const value = () => props.value !== undefined ? props.value : internal();

const setValue = (next: T) => {
    if (props.value === undefined) setInternal(() => next);
    props.onValueChange?.(next);
};
```

变体：

- 布尔开合：`open` / `defaultOpen` / `onOpenChange`（Dialog、Popover、Tooltip、Sheet、Drawer、DropdownMenu…）。
- 选择值：`value` / `defaultValue` / `onValueChange`（Tabs、ToggleGroup、Select、Combobox、Calendar…）。
- 值可能为 `null`（NumberInput、Select 的受控清空）时，用 `undefined` 区分“未受控”，`null` 表示空值。

状态通常收敛在根组件的 **Context + Provider** 中，子部件通过 `useXxxContext("组件名")` 消费；缺失时抛中文错误
（如 `TabsList 必须渲染在 Tabs 内部`）。

## 4. 事件详情（ChangeEventDetails）

部分回调的第二个参数对齐 Base UI 的 `ChangeEventDetails`：

```ts
interface ChangeEventDetails<R extends string = string> {
    reason: R;                 // 触发来源
    event: Event | undefined;
    trigger: Element | undefined;
    cancel(): void;           // 阻止组件提交本次变更
    allowPropagation(): void; // API 对齐保留
    readonly isCanceled: boolean;
    readonly isPropagationAllowed: boolean;
}
```

`cancel()` 必须在组件提交状态**之前**调用才有效；`isCanceled` 用 getter 实时读取，不是快照。
不是所有回调都有事件详情：Dialog / Popover / Tooltip / Select 等只回调布尔值或值本身；带 `reason` 的组件见
[组件目录](./components.md)。

通用构造函数在 `~/utils`：`createChangeEventDetails(reason, event, trigger)`。

## 5. 多态组件

用 `PolymorphicProps<T, Extra, EnableAs>`（`~/types`），通过 `component` 指定真实标签/组件：

```tsx
import { Dynamic } from "solid-js/web";

<Dynamic
    {...props}
    component={props.component ?? "div"}
    ref={mergeRefs(internalRef, props.ref)}
/>;
```

- `BaseProps` 提供 `class` / `classList` / `dir` / `style`。
- 默认标签：Button = `"button"`，ContextMenuTrigger = `"div"`，其余见类型文件。
- 需要转发 ref 时用 `mergeRefs`，不要覆盖调用方的 ref。
- `classList` 必须应用到元素；若组件有意不支持，需在该处写 `// classlist-opt-out: <原因>`（CI 会检查）。

## 6. 样式与状态属性

- Tailwind v4；类名合并用 `clsx`（`~/utils`，底层是 `cn` 包），不要改名成 `cn`。
- 变体用 `class-variance-authority`；较大的样式常量放 `*.styles.ts`。
- 组件的公开/主要渲染元素按约定带 `data-slot="<component>-<part>"`，命名与 shadcn 对齐；
  少数内部辅助元素没有 `data-slot`，以源码为准。
- 状态样式统一走 `data-*` 变体：`data-open:`、`data-closed:`、`data-highlighted:`、
  `data-disabled:`、`data-inset:`、`data-[variant=destructive]:`。
- 本实现常把 shadcn 的 `focus:` 换成 `data-highlighted:`：焦点留在浮层上，用
  `aria-activedescendant` 表达高亮。
- 浮层采用 **两层结构**：外层只做 `transform: translate()` 定位，内层做视觉与进出场动画；
  同一个元素不能同时承担定位 transform 和动画 transform。

## 7. 浮层与键盘

- 定位统一走 `packages/positioner`（`createPositioner` + middleware），组件仍从 `~/lib` 消费兼容出口，见 [定位器](./positioner.md)。
- 右键/光标跟随用 `createVirtualElement({ x, y, contextElement })`。
- 菜单类组件把焦点停在浮层上，用 `aria-activedescendant` + `data-highlighted` 表达高亮；
  Tabs / ToggleGroup 用 roving focus（焦点在项之间移动）。方向键、Home/End、typeahead 的语义对齐 Base UI。
- 模态浮层默认锁页面滚动（`lockScroll`，多数默认 `true`）；嵌套浮层用引用计数避免提前解锁。

## 8. 事件绑定

- 组件**不暴露**同名事件 prop 时：用 `addEventListener` 在 ref 回调里绑定，`onCleanup` 解绑，
  避免覆盖调用方的 `onClick` / `onContextMenu`。
- 组件**要暴露**事件 prop 时：显式 `splitProps` 出来，先执行内部逻辑，再用 `callEventHandler` 调用户回调
  （兼容 Solid 的 bound handler `[handler, data]`）。

## 9. 构建与导出

- Vite library 模式自动扫描 `src/components/*/index.ts`、`src/hooks/index.ts`、`src/utils/index.ts`。
- 新增顶层组件：建 `src/components/<name>/index.ts`，在 `src/index.ts` 加 `export * from "~/components/<name>";`。
- `package.json` 的 `exports` 提供 `@neut/ui`、`/hooks`、`/hooks/*`、`/utils`、`/utils/*`、`/components/*`。
- `dist/` 是生成物，不要手改。
