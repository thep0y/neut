# AGENTS.md

面向在本仓库中工作的 AI 编码代理的说明。人类贡献者同样适用。

## 项目是什么

`@neut/ui` 是 **shadcn/ui 的 SolidJS 重实现**：组件全部从零手写，**不依赖任何上游组件库运行时**
（没有 `@radix-ui`、`@base-ui`、`kobalte` 等）。有两个并行的对齐目标：

- **API 语义对齐 Base UI**（`@base-ui/react`）：受控/非受控、`onXxxChange` 事件详情、
  `data-*` 状态属性、ARIA 角色。
- **使用方式对齐 shadcn/ui**：相同的组件名与组合方式、`data-slot` 命名、Tailwind 类名。

组件源码本身就是交付物：使用者可以整目录拷贝 `src/components/<name>/`，或安装 `@neut/ui`。

## 环境与命令

包管理器是 **bun**（见 `bun.lock`）。

| 命令 | 用途 |
| --- | --- |
| `bun install` | 安装依赖 |
| `bun run dev` | 启动 dev playground（等价 `vite ./dev`，默认 <http://localhost:5173>） |
| `bun run build` | 构建组件库到 `dist/`（含 `.d.ts`） |
| `bun run serve` | 预览构建产物 |
| `bun run check` | `tsc --noEmit && biome check --write src`，提交前必须通过 |

注意事项：

- Biome 不在 `devDependencies` 中，CI 通过 `biomejs/setup-biome` 提供。本地需要时用
  `bunx @biomejs/biome check --write src`。
- 只做快速类型检查：`bunx tsc --noEmit`。
- 已知噪声：`lucide-solid@1.47` 的类型声明引用了未安装的 `@lucide/shared/types`，会报
  `TS2307`（位于 `node_modules` 内，与本仓库源码无关）。过滤掉它再判断是否有自己引入的错误。
- 本仓库目前**没有单元测试框架**。`dev/` playground 是主要的手动验证面；需要自动化验证时，
  临时搭 jsdom/浏览器环境自测，验证完删除，不要提交测试脚手架。

## 目录结构

```
src/
├── index.ts                 # 总出口：导出所有组件 + hooks + utils，并 import 样式
├── components/<name>/       # 一个组件一个目录（kebab-case）
├── lib/positioner/          # 自研 floating-ui：createPositioner + middleware
├── types/                   # BaseProps / PolymorphicProps 等公共类型
├── utils/                   # clsx、mergeRefs、logger、getStyleValue、warnOnce
├── hooks/                   # 跨组件 hooks
└── styles/                  # Tailwind 入口、动画、字体
dev/                         # Solid Router playground：examples + pages + routes.ts
example/                     # 独立的消费者示例工程（依赖已发布的 @neut/ui），不参与根检查
dist/                        # 构建产物，gitignored，不要手改
```

- 路径别名 `~/*` → `src/*`（见 `tsconfig.json` 与两个 `vite.config.ts`）。
- 根 `tsconfig.json` 的 `exclude` 包含 `./dev` 与 `example`，即 `bun run check` **不会**
  类型检查它们；改动 dev 后请用 `bun run dev`/`vite build ./dev` 验证。

## 组件文件结构（强约定）

简单组件可以是扁平文件（参考 `src/components/button/`）：

```
button/
├── Button.tsx
├── Button.types.ts
├── Button.styles.ts
└── index.ts
```

有子组件或状态的组件按子组件拆目录（参考 `tabs/`、`select/`、`context-menu/`）：

```
<component>/
├── index.ts                 # 公开出口：组件 + 公开类型
├── <Component>/             # 根状态组件
│   ├── index.ts
│   ├── <Component>.tsx
│   ├── <Component>.types.ts
│   ├── <Component>.context.ts(x)   # Context + useXxxContext
│   └── use<Component>.ts           # 交互算法（可独立推理/测试）
├── <SubComponent>/
│   ├── index.ts
│   ├── <SubComponent>.tsx
│   ├── <SubComponent>.types.ts
│   ├── <SubComponent>.styles.ts    # 可选：样式与渲染分离
│   └── use<SubComponent>.ts        # 可选
└── <component>.styles.ts / <component>.utils.ts / <component>.types.ts  # 共享内部文件
```

**单一职责**是硬要求：一个文件只做一件事，渲染 / 状态 / 交互算法 / ARIA 语义互相解耦。
非平凡组件请在组件目录下补一份 `DESIGN.md`（格式参考 `src/components/tabs/DESIGN.md`：
状态、移植目标、SRP 分工表、文件结构）。

## 编码约定

### Solid 惯用法

- 用 `createSignal` / `createMemo` / `createEffect` / `onCleanup` / `onMount` / `createUniqueId`；
  对外类型用 `Accessor<T>`。
- **受控/非受控双模式**是统一模式：
  `props.value !== undefined` 即受控（只回调、不写内部状态），否则写内部信号并照常回调。
  根组件状态收敛在一个 Context + Provider 中，子组件通过
  `useXxxContext("组件名")` 消费；缺失时抛出中文错误（`<X> 必须渲染在 <Y> 内部`）。
- 属性拆分用 `splitProps`，默认值合并用 `mergeProps`。
- 事件绑定有两种既定写法，按是否需要暴露同名 prop 选择：
  - 组件**不**暴露该事件 prop：用 `addEventListener`（在 ref 回调里绑定，`onCleanup` 解绑），
    这样调用方自己的 `onClick`/`onContextMenu` 不会被覆盖。
  - 组件**要**暴露该事件 prop：显式 `splitProps` 出来并在内部调用用户回调，避免双触发。

### 多态组件

用 `~/types` 的 `PolymorphicProps<T, Extra, EnableAs>`，通过 `component` 指定真实标签/组件，
用 `<Dynamic component={props.component ?? "默认标签"} />` 渲染：

```ts
export type ContextMenuTriggerProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T>;
```

```tsx
<Dynamic {...props} component={props.component ?? "div"} ref={mergeRefs(...)} />
```

- 需要透传 ref 时用 `~/utils` 的 `mergeRefs(内部ref, props.ref, ...)`。
- 默认标签：`Button` = `"button"`，`ContextMenuTrigger` = `"div"`。
- 参考实现：`button/Button`、`tooltip/TooltipTrigger`、`context-menu/ContextMenuTrigger`。

### 样式

- Tailwind v4（`@tailwindcss/vite`），工具函数是 `clsx`（`~/utils`，基于 `tailwind-merge`），
  **不要**改名为 shadcn 的 `cn`。
- 多变体组件用 `class-variance-authority`；较大的样式常量抽到 `Xxx.styles.ts`。
- 每个渲染元素都带 `data-slot="<component>-<part>"`，命名与 shadcn 对齐
  （如 `context-menu-content`、`tooltip-trigger`）。
- 状态样式统一走 `data-*` 变体：`data-open:`、`data-closed:`、`data-highlighted:`、
  `data-disabled:`、`data-inset:`、`data-[variant=destructive]:` 等。
  本实现常把 shadcn 的 `focus:` 换成 `data-highlighted:`（焦点留在浮层上、用
  `aria-activedescendant` 表达高亮），改动时保持全局一致。

### 注释与语言

- 源码注释、错误信息、`DESIGN.md` 一律用**中文**；README 保持中英双份（`README.zh-CN.md`）。
- 注释讲"为什么"（设计取舍、踩过的坑），不要复述代码在做什么。既有注释请保留。

## API 对齐策略

- 移植 Base UI（`@base-ui/react`）的语义时，先读它的 props 表与 `ChangeEventDetails`，
  再决定 Solid 侧类型；`onOpenChange` 等回调第二参为事件详情对象
  （`reason` / `event` / `trigger` / `cancel()` / `allowPropagation()` / `isCanceled`）。
- 不引入任何上游组件库运行时依赖，全部手写；需要浮层能力时用 `src/lib/positioner`。
- 默认值尽量与 Base UI / shadcn 保持一致（例如菜单 `modal` 默认 `true`、`loopFocus` 默认 `true`）。

## 浮层与定位

`src/lib/positioner` 是自研的 floating-ui，入口是 `createPositioner(reference, floating, options)`：

- middleware：`offset` / `flip` / `shift` / `size` / `hide` / `arrow` / `containingBlockOffset`。
- 虚拟锚点（右键坐标、光标跟随）用 `createVirtualElement({ x, y, contextElement })`。
- **两层结构**是既定模式：外层只做 `transform: translate()` 定位，内层做视觉与进出场动画。
  同一个元素不能同时承担"定位 transform"和"动画 transform"，否则动画期间定位会被顶掉。
- 打开时若要等子元素测量后再播放动画，用 `requestAnimationFrame` 延后一帧再置 `data-open`（参考 `popover`/`select`）。

## 构建与打包

- `vite.config.ts` 以 **library 模式**构建：自动扫描 `src/components/*/index.ts`、
  `src/hooks/index.ts`、`src/utils/index.ts` 作为入口，`preserveModules` 输出，
  由 `unplugin-dts` 生成 `.d.ts`。
- 因此**新增一个顶层组件后**：
  1. 建立 `src/components/<name>/index.ts` 作为公开出口；
  2. 在 `src/index.ts` 增加 `export * from "~/components/<name>";`；
  3. 无需改 `vite.config.ts`（入口会自动发现）。
- `package.json` 的 `exports` 提供 `@neut/ui`、`/hooks`、`/hooks/*`、`/utils`、`/utils/*`、
  `/components/*`。
- `dist/` 是生成物，不要手改，也不要提交（已在 `.gitignore`）。

## dev playground

`dev/` 是一个 Solid Router 应用，根布局与侧边栏在 `dev/App.tsx`，路由表在 `dev/routes.ts`。
新增一个组件的演示页：

1. `dev/examples/<name>.tsx`：导出 `Section[]`（`{ id, title, description, component }`），
   用 `./shared` 的 `ComponentPage` / `SectionBlock` 组织；
2. `dev/pages/<name>-page.tsx`：`<ComponentPage id title description sections={...} />`；
3. `dev/routes.ts`：`lazy(() => import("./pages/<name>-page"))` 并加进 `routes`。

演示示例尽量与 shadcn 官方示例保持结构一致（含 `ContextMenuGroup`/`ContextMenuLabel` 的层级、
`inset` 用法等），方便逐条对照。

## 常见任务清单

- **新增组件**：建目录 → 写 `types/context/useXxx/Xxx.tsx/index.ts` → 更新 `src/index.ts`
  → 加 dev 示例与路由 → `bun run check` + `bun run build`。
- **修改公开 API**：同步更新 `*.types.ts`、组件注释里的 `@example`、`index.ts` 导出、
  dev 示例；破坏性变更在提交信息里用 `!` 标注（仓库历史有先例，如 `feat(toggle-group)!:`）。
- **改交互行为**：先对照 Base UI 的对应部件语义；把"为什么"写进注释，必要时补 `DESIGN.md`。

## 验证要求

改完必须至少跑通：

```bash
bunx tsc --noEmit     # 或 bun run check（含 biome）
bun run build         # 库构建 + d.ts
bun run dev           # 手动过一遍受影响的交互
```

涉及 dev 的改动额外用 `vite build ./dev` 确认能构建。

## 不要做

- 不要新增 `@radix-ui` / `@base-ui` / `kobalte` 等组件库依赖。
- 不要把 `clsx` 改成 `cn`，不要绕过 `~/lib/positioner` 自己引 floating-ui。
- 不要手改 `dist/`；不要提交 `dist/`、`dev/dist/`。
- 不要给根 `tsconfig.json` 加 `dev`/`example` 的包含项来"顺手"检查它们。
- 不要在 `src/components/*/index.ts` 与 `src/index.ts` 之外额外维护导出清单。
- 不要只改实现却漏掉同步的 `data-slot`、`data-*` 状态属性或中文注释。
