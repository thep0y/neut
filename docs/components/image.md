# Image

`next/image` 风格的图片组件：自动 `srcSet`、blur 占位、`fill`、预加载与开发期校验。

```tsx
import { Image } from "@neut/ui";

<Image src="/hero.jpg" alt="Hero" width={1200} height={630} placeholder="blur" />;

<Image src={logo} alt="Logo" fill sizes="(max-width: 768px) 100vw, 50vw" />;
```

## Props

| Prop | 类型 | 说明 |
| :--- | :--- | :--- |
| `src` | `string \| StaticImport` | 图片地址或静态导入对象 |
| `alt` | `string` | 必填 |
| `width` / `height` | `number \| string` | 非 fill 模式必填（数字或数字字符串） |
| `fill` | `boolean` | 填满父容器（父元素需定位） |
| `loader` | `ImageLoader` | 自定义 URL 生成 |
| `quality` | `number \| string` | 传给 loader |
| `preload` | `boolean` | 生成 `<link rel="preload">` |
| `loading` | `"lazy" \| "eager"` | 原生 loading |
| `placeholder` | `"blur" \| "empty" \| "data:image/…"` | 占位 |
| `blurDataURL` | `string` | blur 占位图 |
| `unoptimized` | `boolean` | 关闭优化（仍生成 srcSet 结构） |
| `overrideSrc` | `string` | 覆盖最终 src |
| `onLoad` | `(event) => void` | 加载完成 |

已弃用但仍兼容：`priority`（用 `preload`）、`onLoadingComplete`（用 `onLoad`）、
`layout` / `objectFit` / `objectPosition`（用 `style`）、`lazyBoundary` / `lazyRoot`（无效）。

## 行为

- 默认配置里 `loader: "default"`，生成 `/_next/image?url=…&w=…&q=…` 形式的 srcSet；
  没有 Next.js 服务端时请传自定义 `loader` 或 `unoptimized`。
- `fill` 时要求父元素 `position: relative`，否则开发环境会警告。
- 开发环境会校验：缺少 `alt`、`width`/`height`、非法 `placeholder`、loader 返回宽度缺失等。
  这些警告通过 `logger.hot("image-dev", "warn")` 按时间窗口节流（默认 1000ms / 5 条），
  不是按消息永久去重；高频渲染时超出的警告会由 logger 汇总。
- `ImageConfigContext` 可用于提供全局配置（`deviceSizes`、`imageSizes`、`domains` 等），但当前
  没有从组件包导出 Provider；需要自定义配置时按 `Image.config.ts` 的结构自行创建 Context 或
  使用默认配置。
- 复用 `ImageElement` / `ImagePreload` 两个内部组件；`Image.utils.ts` 只做编排。

完整设计与文件结构见 [Image DESIGN](../../src/components/image/DESIGN.md)。
