# 快速上手

## 环境要求

- SolidJS `^1.9.15`
- Tailwind CSS v4（`tailwindcss` + `@tailwindcss/vite`）
- Vite（示例使用 `vite-plugin-solid`）

Neut 的 peer dependencies（见 [package.json](../package.json)）：

| 依赖 | 版本 | 用途 |
| :--- | :--- | :--- |
| `solid-js` | `^1.9.15` | 运行时 |
| `class-variance-authority` | `^0.7.1` | 组件变体 |
| `lucide-solid` | `^1.51.0` | 内置图标 |
| `cn` | `^0.4.0` | 类名合并（`src/utils/clsx.ts` 直接 re-export 它的 `cn`） |

`tailwindcss` 不在 `peerDependencies` 里，但样式产物依赖它，必须安装。

## 安装

```bash
bun i @neut/ui
bun i solid-js class-variance-authority lucide-solid cn
bun i -D tailwindcss @tailwindcss/vite
```

## 配置 Vite 与 Tailwind

```ts
// vite.config.ts
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [solid(), tailwindcss()],
});
```

在应用入口样式里按顺序引入：

```css
/* src/index.css */
@import "tailwindcss";
@import "../node_modules/@neut/ui/dist/ui.css";
```

`dist/ui.css` 已包含：

- 设计 token（`:root` / `[data-theme="dark"]`）
- `@theme inline` 的颜色、圆角、动画映射
- 进出场动画（`animate-in` / `animate-out`、`fade-*`、`zoom-*`、`slide-*` 等）
- `scroll-fade`、`no-scrollbar`、`shimmer` 等工具类
- `i18n-font.css` 里的 `data-lang` 字体与行高规则

> 不再需要单独引入 `toast.css` / `animate.css`。当前只有 `src/styles/index.css` 一个样式入口，
> 它引入了 `animate.css`、`effects.css`、`i18n-font.css`；构建后统一输出为 `dist/ui.css`。

## 主题 token

颜色 token 以 CSS 变量暴露，默认是中性色。按需在 `:root` 覆盖，例如：

```css
:root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --primary: oklch(0.205 0 0);
    --primary-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.577 0.245 27.325);
    --border: oklch(0.922 0 0);
    --radius: 0.625rem;
}
```

完整 token（见 [src/styles/index.css](../src/styles/index.css)）：

| 分组 | Token |
| :--- | :--- |
| 基础 | `--background` / `--foreground` / `--border` / `--input` / `--ring` |
| 表面 | `--card` / `--card-foreground` / `--popover` / `--popover-foreground` |
| 强调 | `--primary` / `--primary-foreground` / `--secondary` / `--secondary-foreground` / `--accent` / `--accent-foreground` / `--muted` / `--muted-foreground` |
| 状态 | `--success` / `--warning` / `--info` / `--destructive` 及各自的 `*-foreground`（`@theme inline` 映射为 `text-success` / `bg-warning/10` 等类名） |
| 图表 | `--chart-1` … `--chart-5` |
| 侧边栏 | `--sidebar` / `--sidebar-foreground` / `--sidebar-primary` / `--sidebar-primary-foreground` / `--sidebar-accent` / `--sidebar-accent-foreground` / `--sidebar-border` / `--sidebar-ring` |
| 圆角 | `--radius`（并派生 `--radius-sm` … `--radius-4xl`） |

## 暗色模式

暗色主题用 **`data-theme="dark"`** 选择器，不是 `.dark` class：

```html
<html data-theme="dark">
```

组件内部的状态样式使用 `data-*` 变体（如 `data-open:`、`data-highlighted:`、`data-disabled:`），
与主题切换互不影响。

## 移动端安全区

在 `<meta name="viewport">` 中启用 `viewport-fit=cover`：

```html
<meta
    name="viewport"
    content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

`dist/ui.css` 提供四个安全区工具类，对应 `env(safe-area-inset-*)`：

| 类名 | 作用 |
| :--- | :--- |
| `pt-safe` | `padding-top: env(safe-area-inset-top)` |
| `pb-safe` | `padding-bottom: env(safe-area-inset-bottom)` |
| `pl-safe` | `padding-left: env(safe-area-inset-left)` |
| `pr-safe` | `padding-right: env(safe-area-inset-right)` |

Drawer / Sheet / Toast 已默认使用；自定义固定底栏、顶栏或全屏面板直接加类即可：

```html
<footer class="pb-safe">…</footer>
```

## 移动端触控目标

`dist/ui.css` 内置 `@media (pointer: coarse)` 规则，触摸设备上：

- Button 保留尺寸层级：xs 36 / sm 40 / md 44 / lg 48；小于 44 的档位用 `::after` 把命中区补到 44；
- Toggle / TabsTrigger / 菜单项 / 下拉选项 / PaginationLink 最小 44×44；
- Checkbox / Radio 视觉尺寸 16 → 20；Switch md 44×26 / sm 40×24（thumb 22/20）；Slider thumb 12 → 20、轨道 4 → 6；
- 这些控件同时用 `::after` 保留约 44×44 的命中区；
- Calendar 单元格从 28px 提到 36px；
- Resizable 手柄的命中区从 4px 提到 12px。

鼠标/触控板环境不受影响。

## 多语言字体（可选）

`src/styles/i18n-font.css` 按 `data-lang` 设置 `font-family` 与行高系数。取值：

`en`、`fr`、`de`、`ru`、`zh-hans`、`zh-hant`、`ja`、`ko`、`hi`、`bn`、`th`、`ar`、`fa`、`he`。

手动设置：

```html
<html lang="zh-CN" data-lang="zh-hans">
```

或用 `useFontLoader` 自动加载 Google Fonts 并写入 `data-lang`：

```tsx
import { useFontLoader } from "@neut/ui";

function App() {
    useFontLoader({ langs: ["zh-hans", "en"] });
    return <main>…</main>;
}
```

注意：

- 只写第一个合法语言到 `data-lang`（决定字体与行高），其余语言用于预加载。
- `targetRef` 可把 `data-lang` 写到局部元素；卸载时会恢复原值。
- `apply: false` 只预加载字体，不改 DOM。
- 该 hook 直接向 `document.head` 插入 Google Fonts `<link>`；离线/内网环境请改用自托管字体与手写 `data-lang`。

## 方式一：复制源码

1. 复制 `src/components/<name>/`。
2. 复制共享依赖：
   - `src/utils/`（`clsx`、`mergeRefs`、`callEventHandler` 等）
   - `src/types/`（`BaseProps`、`PolymorphicProps`）
   - `src/hooks/`（`useScrollLock`、`useScrollEdges` 等，组件实际 import 到的 hook）
   - `packages/positioner/src/`（仅浮层组件需要；把 `@neut/positioner` 映射到该目录，发布包已内置）
3. 配置 `~/*` 别名：

```ts
// vite.config.ts
resolve: { alias: { "~": path.resolve(__dirname, "./src") } }
```

```json
// tsconfig.json
"paths": { "~/*": ["./src/*"] }
```

4. 把该组件的样式依赖（`data-slot`、Tailwind 类）一起复制；不要只复制 `.tsx`。
5. 引入样式：复制 `src/styles/` 并在入口 `@import "./styles/index.css"`，或改用
   `@import "../node_modules/@neut/ui/dist/ui.css"`。缺少 token/动画工具类时组件仍能渲染，
   但主题色、圆角与进出场动效会缺失。

组件各有独立入口，可以单独使用；少数组件内部会复用其他组件（例如 `AlertDialog` 复用 `Dialog` 的内部实现），复制源码时把被复用的组件一起复制即可，不需要带上无关组件。

## 方式二：从 `@neut/ui` 导入

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from "@neut/ui";

export function Demo() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Hello</CardTitle>
            </CardHeader>
            <CardContent>
                <Button>Click me</Button>
            </CardContent>
        </Card>
    );
}
```

## 下一步

- [组件目录](./components.md)：按类别查找组件与子部件
- [架构说明](./architecture.md)：受控/非受控、事件详情与多态
- [定位器](./positioner.md)：浮层定位与虚拟锚点
