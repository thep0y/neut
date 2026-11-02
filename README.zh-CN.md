# Neut

> **SolidJS 原生组件库 —— 不依赖任何上游组件库运行时**

Neut 是 [shadcn/ui](https://ui.shadcn.com) 的 SolidJS 从零实现。和 shadcn 不同，Neut **不依赖任何上游组件库运行时**（例如 `@radix-ui`、`@base-ui`、Kobalte）。

它只依赖 shadcn 项目本来就会安装的几个包：`solid-js`、`class-variance-authority`、`lucide-solid`、`cn`；样式使用 Tailwind CSS v4。

**状态：** pre-1.0 · 60 个组件 · 活跃开发中。

**优点**

- **完全可控**：所有组件源码都在你的项目里，想怎么改就怎么改。
- **不受上游限制**：不会因为第三方组件的样式或逻辑 Bug 而卡住，修问题不用等发版。
- **SolidJS 原生**：利用细粒度响应式，而不是虚拟 DOM。

**缺点也要说清楚**

因为没有依赖更成熟的上游组件库，Neut 在一些边缘场景上覆盖不够，会有一些能修但还没修的缺陷，比如 Bug、无障碍支持等。所以**不建议用在大型项目或对质量要求严格的场景**。

> [!WARNING]
>
> **开发中，慎用**
>
> 项目还在活跃开发，API 可能会变，**生产环境先别用**。

---

## 📚 文档

| 文档                                                | 内容                                                   |
| :-------------------------------------------------- | :----------------------------------------------------- |
| [文档索引](./docs/README.md)                        | 使用者与贡献者文档的全貌                               |
| [快速上手](./docs/getting-started.md)               | 安装、Tailwind v4 配置、主题 token、暗色模式、复制源码 |
| [组件目录](./docs/components.md)                    | 所有导出组件及其子部件                                 |
| [自研组件用法](./docs/components/README.md)         | 复杂/自研组件的详细 API 与用法                         |
| [架构说明](./docs/architecture.md)                  | 受控/非受控、事件详情、多态、样式约定                  |
| [定位器](./docs/positioner.md)                      | 自研浮层定位引擎                                       |
| [Hooks](./docs/hooks.md) / [Utils](./docs/utils.md) | 公开 hooks 与工具函数                                  |
| [设计文档索引](./docs/README.md#设计文档索引)       | 各复杂组件的设计说明                                   |
| [TESTING.md](./TESTING.md)                          | 测试目录、覆盖率门禁与贡献规则                         |
| [AGENTS.md](./AGENTS.md)                            | 仓库约定与分支/PR 流程                                 |

> 内部设计/测试文档使用中文；README 保持中英双份。

---

## 🚀 快速上手

Neut 采用 **“复制即用”** 的模式（类似 shadcn），也可以作为普通依赖安装。

### 1. 环境要求

- **Bun**（仓库脚本使用；使用方可以用任意包管理器）
- SolidJS `^1.9.15`
- Tailwind CSS v4

### 2. 安装

```bash
# 组件库 + 运行时 peer dependencies
bun i @neut/ui solid-js class-variance-authority lucide-solid cn

# Tailwind CSS v4
bun i -D tailwindcss @tailwindcss/vite
```

| 依赖                         | 用途                                       | 版本      |
| :--------------------------- | :----------------------------------------- | :-------- |
| **solid-js**                 | 运行时                                     | `^1.9.15` |
| **class-variance-authority** | 样式变体                                   | `^0.7.1`  |
| **lucide-solid**             | 图标                                       | `^1.51.0` |
| **cn**                       | 类名合并（替代 `clsx` + `tailwind-merge`） | `^0.4.0`  |
| **tailwindcss**              | 样式引擎                                   | `^4`      |

**配置 Vite**

```ts
// vite.config.ts
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [solid(), tailwindcss()],
});
```

**引入样式**

在应用入口样式文件里先引入 Tailwind，再引入 Neut 的构建产物：

```css
@import "tailwindcss";
@import "../node_modules/@neut/ui/dist/ui.css";
```

> [!NOTE]
> Neut 只发布一份编译后的 `dist/ui.css`，其中包含设计 token、暗色主题、动画、scroll-fade 工具类以及多语言字体/行高规则。**不需要**再单独引入 `toast.css` 或 `animate.css`。

**主题与暗色模式**

设计 token 是 CSS 自定义属性（`--background`、`--primary`、`--border` 等）。在 `:root` 里覆盖即可；暗色模式通过 `<html data-theme="dark">` 切换（不是 `.dark` class）：

```html
<html data-theme="dark">
```

完整 token 列表与可选的字体/多语言配置见 [快速上手](./docs/getting-started.md#主题-token)。

### 3. 包导出

| 入口                         | 内容                       |
| :--------------------------- | :------------------------- |
| `@neut/ui`                   | 全部组件、hooks 与工具函数 |
| `@neut/ui/hooks`             | 公开 hooks                 |
| `@neut/ui/utils`             | 公开工具函数               |
| `@neut/ui/components/<name>` | 单个组件入口               |
| `@neut/ui/dist/ui.css`       | 编译后的样式文件           |

### 4. 方式 A：复制源码（推荐）

1. 把需要的组件目录（例如 `src/components/button/`）复制到你的项目。
2. 同时复制它依赖的共享模块：`src/utils/`、`src/types/`、`src/hooks/`，浮层组件还需要 `src/lib/positioner/`。
3. 少数组件会在内部组合其他组件（例如 `AlertDialog` → `Dialog`、`DatePicker` → `Calendar`/`Popover`/`Button`）；这些依赖也要一起复制，或直接使用包入口。
4. 保留 `~/*` 别名（或改写 import），让 `~/utils`、`~/types`、`~/hooks`、`~/lib` 能解析。
5. 复制或引入样式：源码方式用 `src/styles/index.css`，安装包方式用 `@neut/ui/dist/ui.css`。缺少设计 token 与动画工具类时，组件仍能渲染，但会丢失主题色/动效。

### 5. 方式 B：作为依赖安装

```bash
bun i @neut/ui
```

按上面的方式引入样式，然后使用组件：

```tsx
import { Button } from "@neut/ui";

function App() {
  return <Button>Neut Button</Button>;
}
```

完整的消费者示例工程见 [`example/`](./example)。

---

## 🧩 组件一览

当前共有 **60 个组件**。完整目录（含子部件与关键 props）见 [`docs/components.md`](./docs/components.md)。

- **布局与结构**：Accordion、AspectRatio、Card、Carousel、Collapsible、Resizable、ScrollArea、Separator、Sidebar、Tabs、Table
- **表单与输入**：Button、ButtonGroup、Calendar、Checkbox、Combobox、DatePicker、Field、Input、InputGroup、Label、NumberInput、Questionnaire、RadioGroup、Select、Slider、Switch、Textarea、TimePicker、Toggle、ToggleGroup
- **浮层**：AlertDialog、ContextMenu、Dialog、Drawer、DropdownMenu、HoverCard、Popover、Sheet、Tooltip
- **反馈与状态**：Alert、Badge、Empty、Item、Kbd、Marker、Progress、Skeleton、Spinner、Toast
- **数据展示**：Avatar、Breadcrumb、DataTable、Pagination
- **聊天与 AI**：Attachment、Bubble、Message、MessageScroller
- **媒体与工具**：Image、ScrollArrows

---

## 🛠 开发

```bash
bun install
bun run dev             # playground：http://localhost:7789
bun run build           # 构建到 dist/（JS + d.ts + ui.css）
bun run serve           # 预览生产构建
bun run check           # tsc + Biome（2.6.4，来自 devDependencies）
bun run test            # 全量单元测试
bun run test:affected   # 只跑受当前改动影响的测试
bun run test:coverage   # 覆盖率百分比门禁
bun run check:branches  # 精确分支覆盖率门禁（不允许真实未覆盖缺口）
```

改动 playground 后，用 `bunx vite build ./dev` 确认能构建。

---

## 🤝 贡献

- **从 `main` 切分支，PR 合回 `main`**。`main` 是唯一长期分支，不要直接向它提交或推送。
- 一个改动一个功能分支，分支和提交都保持单一职责：`feat/`、`fix/`、`refactor/`、`docs/`、`chore/`、`test/`。
- 有依赖关系的改动用 stacked PR：后一个 PR 的 base 指向被依赖的分支，前一个合并后 GitHub 会自动把 base 改成 `main`。
- 测试放在 `tests/` 下、与 `src/` 镜像；写测试前先读 [TESTING.md](./TESTING.md)。
- 合并前必须通过 `bun run check`、`bun run test:coverage`、`bun run check:branches`。
- 完整约定见 [AGENTS.md](./AGENTS.md)。

---

## 📚 参考与致谢

- **shadcn/ui**：[Installation Guide](https://ui.shadcn.com/docs/installation)
- **Base UI**：[Documentation](https://base-ui.com/)
- **Sonner**：[Getting Started](https://sonner.emilkowal.ski/getting-started)
- **SolidJS**：[Official Website](https://www.solidjs.com/)

---

## 💡 为什么选这种模式？

Neut 遵循 **“无头组件”** 和 **“自己搭积木”** 的理念：

1. **没有多余开销**：只用你实际引入的代码。
2. **样式随便改**：Tailwind 的 class 就在你眼皮底下，想调就调。
3. **发挥 SolidJS 优势**：细粒度响应式让组件在高性能的同时，代码量更少、逻辑更清爽。
