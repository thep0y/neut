/**
 * ImagePreload.tsx
 * 单一职责：仅负责向 <head> 注入 <link rel="preload"> 标签，
 * 以提升 LCP 图片的加载优先级。不包含任何 <img> 渲染逻辑。
 */

import type { Component } from "solid-js";
import { Portal } from "solid-js/web";
import type { ImgProps } from "./Image.types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ImagePreloadProps {
  imgAttributes: Pick<
    ImgProps,
    | "src"
    | "srcSet"
    | "sizes"
    | "crossOrigin"
    | "referrerPolicy"
    | "fetchpriority"
  >;
}

// ─── 组件 ─────────────────────────────────────────────────────────────────────

/**
 * 通过 SolidJS <Portal> 将 <link> 插入 document.head。
 *
 * 注意：
 * - 故意省略 href（当 imagesrcset 存在时），以避免不支持 srcset 的浏览器
 *   加载错误尺寸的图片。详见 HTML spec §attr-link-imagesrcset。
 * - SolidJS SSR 环境可将此组件替换为 server-side head injection。
 */
const ImagePreload: Component<ImagePreloadProps> = (props) => {
  const { imgAttributes: a } = props;

  // 唯一 key 避免重复插入相同的 preload
  const linkKey = `__img-preload-${a.src}-${a.srcSet ?? ""}-${a.sizes ?? ""}`;

  // 若已存在相同 key 的 link，则跳过（SSR hydrate 场景）
  if (typeof document !== "undefined") {
    if (document.head.querySelector(`link[data-img-key="${linkKey}"]`)) {
      return null;
    }
  }

  return (
    <Portal mount={document.head}>
      <link
        rel="preload"
        as="image"
        data-img-key={linkKey}
        // 当存在 srcset 时不设置 href，遵从 spec
        href={a.srcSet ? undefined : a.src}
        imagesrcset={a.srcSet}
        imagesizes={a.sizes}
        crossorigin={a.crossOrigin}
        referrerpolicy={a.referrerPolicy}
        fetchpriority={a.fetchpriority}
      />
    </Portal>
  );
};

export default ImagePreload;
