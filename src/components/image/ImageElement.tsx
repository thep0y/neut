/**
 * ImageElement.tsx
 * 单一职责：仅负责渲染原生 <img> 元素，并将 ref 回调、onLoad、onError 事件桥接到
 * 上层传入的副作用函数。不包含配置解析、preload 或 blur placeholder 逻辑。
 */

import { type Component, mergeProps, splitProps } from "solid-js";
import type {
  ImgProps,
  OnLoad,
  OnLoadingComplete,
  PlaceholderValue,
} from "./Image.types";
import { handleLoading } from "./Image.utils";

// ─── 额外内部 Props ────────────────────────────────────────────────────────────

export interface ImageElementProps extends ImgProps {
  unoptimized: boolean;
  placeholder: PlaceholderValue;
  /** 上层通过 signal setter 传入，避免在此组件内管理状态 */
  setBlurComplete: (v: boolean) => void;
  setShowAltText: (v: boolean) => void;
  sizesInput: string | undefined;
  onLoad?: OnLoad;
  onLoadingComplete?: OnLoadingComplete;
  // onError?: (e: Event) => void;
  /** 透传给原生 img 的 ref */
  ref?: (el: HTMLImageElement) => void;
}

// ─── 组件 ─────────────────────────────────────────────────────────────────────

const ImageElement: Component<ImageElementProps> = (rawProps) => {
  const props = mergeProps({ decoding: "async" as const }, rawProps);

  // 分离内部 props 与透传给 <img> 的 props
  const [internal, imgAttrs] = splitProps(props, [
    "src",
    "srcSet",
    "sizes",
    "height",
    "width",
    "decoding",
    "class",
    "classList",
    "style",
    "fetchpriority",
    "placeholder",
    "loading",
    "unoptimized",
    "fill",
    "setBlurComplete",
    "setShowAltText",
    "sizesInput",
    "onLoad",
    "onError",
    "onLoadingComplete",
    "ref",
    "alt",
  ]);

  /**
   * ref 回调：在元素挂载后立即处理"图片在 hydrate 前已加载完成"的情况，
   * 并将 ref 透传给调用方（如需要访问 img 节点）。
   */
  function handleRef(img: HTMLImageElement) {
    if (!img) return;

    // 让 Safari 重新触发 onerror（如果图片在 hydrate 前就已失败）
    if (internal.onError) {
      // biome-ignore lint/correctness/noSelfAssign: If the image has an error before react hydrates, then the error is lost. The workaround is to wait until the image is mounted which is after hydration, then we set the src again to trigger the error handler (if there was an error).
      img.src = img.src;
    }

    if (!import.meta.env.PROD) {
      if (!internal.src) {
        console.error('[Image] 缺少必填属性 "src"', img);
      }
      if (img.getAttribute("alt") === null) {
        console.error(
          '[Image] 缺少必填属性 "alt"，请为屏幕阅读器和搜索引擎提供替代文本。',
        );
      }
    }

    // 图片在组件挂载前已完成加载（cached 场景）
    if (img.complete) {
      handleLoading(
        img,
        internal.placeholder,
        internal.onLoad,
        internal.onLoadingComplete,
        internal.setBlurComplete,
        internal.unoptimized,
        internal.sizesInput,
      );
    }

    // 透传 ref
    internal.ref?.(img);
  }

  return (
    // 注意属性顺序：
    // 1. loading 在 src 之前，修复 Safari/Firefox 懒加载时机问题
    // 2. sizes / srcSet 在 src 之前，避免 Safari 提前请求错误尺寸
    // 3. src 最后设置
    <img
      {...imgAttrs}
      // React 19 使用 camelCase fetchPriority；SolidJS 直接透传 JSX 属性即可
      alt={internal.alt}
      loading={internal.loading}
      width={internal.width}
      height={internal.height}
      decoding={internal.decoding}
      data-nimg={internal.fill ? "fill" : "1"}
      class={internal.class}
      style={internal.style}
      sizes={internal.sizes}
      srcset={internal.srcSet}
      src={internal.src}
      ref={handleRef}
      onLoad={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        handleLoading(
          img,
          internal.placeholder,
          internal.onLoad,
          internal.onLoadingComplete,
          internal.setBlurComplete,
          internal.unoptimized,
          internal.sizesInput,
        );
      }}
      onError={(e) => {
        // 图片加载失败时显示 alt 文本
        internal.setShowAltText(true);
        if (internal.placeholder !== "empty") {
          // 即使真实图片失败，也要移除 blur placeholder
          internal.setBlurComplete(true);
        }

        if (!internal.onError) return;

        if (typeof internal.onError !== "function") return;

        internal.onError(e);
      }}
    />
  );
};

export default ImageElement;
