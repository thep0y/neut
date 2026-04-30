# Neut

> **SolidJS 原生组件库，零外部依赖**

Neut 的灵感来自 [shadcn/ui](https://ui.shadcn.com)，但完全用 SolidJS 从头实现。和 shadcn 不一样的是，Neut **不依赖任何上游组件库**（比如 `@radix-ui` 或 `@base-ui`）。

**优点：**

- **完全可控**：所有组件源码都在你的项目里，想怎么改就怎么改。
- **不受上游限制**：不会因为第三方组件的样式或逻辑 Bug 而卡住，修问题不用等发版。
- **SolidJS 原生**：充分利用 SolidJS 的细粒度响应式，性能更好。

**缺点也要说清楚：**

坦白讲，因为没有依赖那些更成熟的上游组件库，Neut 在一些边缘场景上可能覆盖不够，会有一些能修但还没修的缺陷，比如 Bug、无障碍支持等。所以**不建议用在大型项目或对质量要求严格的场景**。

> [!WARNING]
>
> **开发中，慎用**
>
> 项目还在活跃开发，API 可能会变，**生产环境先别用**。

---

## 🚀 快速上手

Neut 采用的是 **“复制即用”** 的模式（类似 shadcn），当然你也可以把它当成普通依赖来安装。

### 1. 准备工作 (Peer Dependencies)

用组件之前，先确保项目里装好了下面这些依赖：

| 依赖库                       | 用途         | 安装命令                         |
| :--------------------------- | :----------- | :------------------------------- |
| **Tailwind CSS**             | 样式引擎     | `bun i -D tailwindcss`           |
| **Lucide Solid**             | 图标库       | `bun i lucide-solid`             |
| **Tailwind Merge**           | 样式合并工具 | `bun i tailwind-merge`           |
| **Class Variance Authority** | 样式变体定义 | `bun i class-variance-authority` |

**配置样式文件**

在主样式文件（比如 `index.css` 或 `globals.css`）里按顺序引入：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Neut 内置样式（来自 animate.css 和 toast.css） */
@import "./styles/animate.css";
@import "./styles/toast.css";
```

**创建工具函数**

在 `src/lib/utils/clsx.ts` 里写一个样式合并函数：

```ts
import { twMerge } from "tailwind-merge";

export const clsx = (...classes: (string | undefined | false)[]): string => {
    return twMerge(classes.filter(Boolean));
};
```

> [!NOTE]
> **关于样式文件**
> `toast.css` 目前是临时方案（从 Sonner 移植过来的）。后面我们会重写样式，把这个外部依赖去掉。

### 2. 方式 A：复制源码（推荐）

这种方式最灵活。非基础组件之间可能存在功能重叠（比如 `AlertDialog` 和 `Dialog`），但各自独立，互不依赖。

1.  去 [GitHub 仓库 - Components](https://github.com/thep0y/neut) 看组件源码。
2.  把你需要的组件目录（比如 `button`）复制到项目里。

**目录结构示例：**

```bash
src/
└── components/
    └── button/
        ├── Button.styles.ts   # 样式逻辑
        ├── Button.tsx         # 组件实现
        ├── Button.types.ts    # 类型定义
        └── index.ts           # 导出入口
```

### 3. 方式 B：作为依赖安装

如果想直接管理版本，也可以走包管理器安装。

**安装：**

```bash
bun i @neut/ui
```

**引入样式：**

在根样式文件里加上：

```css
@import "../node_modules/@neut/ui/dist/ui.css";
```

**使用组件：**

```tsx
import { Button } from "@neut/ui";

function App() {
    return <Button>Neut Button</Button>;
}
```

**完整示例参考：** [Neut Example Project](https://github.com/thep0y/neut/tree/main/example)

---

## 📚 参考与致谢

项目设计和灵感来自下面这些优秀项目：

- **shadcn/ui**: [Installation Guide](https://ui.shadcn.com/docs/installation)
- **Sonner**: [Getting Started](https://sonner.emilkowal.ski/getting-started)
- **SolidJS**: [Official Website](https://www.solidjs.com/)

---

## 💡 为什么选这种模式？

Neut 遵循 **“无头组件”**和 **“自己搭积木”** 的理念。也就是说：

1.  **没有多余开销**：只用你实际引入的代码。
2.  **样式随便改**：Tailwind 的 class 就在你眼皮底下，想调就调。
3.  **发挥 SolidJS 优势**：相比 React，SolidJS 的细粒度响应式让组件在高性能的同时，代码量更少、逻辑更清爽。
