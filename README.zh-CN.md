# Neut

> **SolidJS 原生组件库 —— 不依赖任何上游组件库运行时**

Neut 的灵感来自 [shadcn/ui](https://ui.shadcn.com)，但完全用 SolidJS 从头实现。和 shadcn 不同，Neut **不依赖任何上游组件库运行时**（例如 `@radix-ui`、`@base-ui`、Kobalte）。

它只使用 shadcn 项目本来也会安装的几个小工具：`class-variance-authority`（变体）、`lucide-solid`（图标）和 `cn`（类名合并）。

**优点**

- **完全可控**：所有组件源码都在你的项目里，想怎么改就怎么改。
- **不受上游限制**：不会因为第三方组件的样式或逻辑 Bug 而卡住，修问题不用等发版。
- **SolidJS 原生**：利用细粒度响应式，而不是虚拟 DOM。

**缺点也要说清楚**

坦白讲，因为没有依赖更成熟的上游组件库，Neut 在一些边缘场景上覆盖不够，会有一些能修但还没修的缺陷，比如 Bug、无障碍支持等。所以**不建议用在大型项目或对质量要求严格的场景**。

> [!WARNING]
>
> **开发中，慎用**
>
> 项目还在活跃开发，API 可能会变，**生产环境先别用**。

---

## 📚 文档

| 文档 | 内容 |
| :--- | :--- |
| [文档索引](./docs/README.md) | 使用者与贡献者文档的全貌 |
| [快速上手](./docs/getting-started.md) | 安装、Tailwind v4 配置、主题 token、暗色模式、复制源码 |
| [组件目录](./docs/components.md) | 所有导出组件及其子部件 |
| [自研组件用法](./docs/components/README.md) | 复杂/自研组件的详细 API 与用法 |
| [架构说明](./docs/architecture.md) | 受控/非受控、事件详情、多态、样式约定 |
| [定位器](./docs/positioner.md) | 自研浮层定位引擎 |
| [Hooks](./docs/hooks.md) / [Utils](./docs/utils.md) | 公开 hooks 与工具函数 |
| [设计文档索引](./docs/README.md#设计文档索引) | 各复杂组件的设计说明 |
| [TESTING.md](./TESTING.md) | 测试目录、覆盖率门禁与贡献规则 |

> 内部设计/测试文档使用中文；README 保持中英双份。

---

## 🚀 快速上手

Neut 采用 **“复制即用”** 的模式（类似 shadcn），也可以作为普通依赖安装。

### 1. 准备工作

```bash
# 运行时 peer dependencies
bun i solid-js class-variance-authority lucide-solid cn

# Tailwind CSS v4
bun i -D tailwindcss @tailwindcss/vite
```

| 依赖 | 用途 | 版本 |
| :--- | :--- | :--- |
| **solid-js** | 运行时 | `^1.9.15` |
| **class-variance-authority** | 样式变体 | `^0.7.1` |
| **lucide-solid** | 图标 | `^1.51.0` |
| **cn** | 类名合并（替代 `clsx` + `tailwind-merge`） | `^0.4.0` |
| **tailwindcss** | 样式引擎 | `^4` |

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

### 2. 方式 A：复制源码（推荐）

1. 把需要的组件目录（例如 `src/components/button/`）复制到你的项目。
2. 同时复制它依赖的共享模块：`src/utils/`、`src/types/`，浮层组件还需要 `src/lib/positioner/`。
3. 保留 `~/*` 别名（或改写 import），让 `~/utils`、`~/types`、`~/lib` 能解析。
4. 复制或引入样式：源码方式用 `src/styles/index.css`，安装包方式用 `@neut/ui/dist/ui.css`。
   缺少设计 token 与动画工具类时，组件仍能渲染，但会丢失主题色/动效。

组件之间有意保持独立，因此功能有重叠的组件（例如 `AlertDialog` 与 `Dialog`）可以分开使用。

### 3. 方式 B：作为依赖安装

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
bun run test            # 单元测试
bun run test:coverage   # 覆盖率门禁
bun run check           # tsc + biome
bun run build           # 构建到 dist/
```

仓库约定见 [AGENTS.md](./AGENTS.md)；写测试前必须先读 [TESTING.md](./TESTING.md)。

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
