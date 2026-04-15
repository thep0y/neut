/**
 * Image.tsx
 * 单一职责：组合层——解析 props、管理 blur/showAltText 状态、
 * 合并配置，然后将职责委托给 ImageElement 和 ImagePreload。
 * 不包含任何加载逻辑或 DOM 操作。
 */

import { type Component, createMemo, createSignal, Show } from "solid-js";
import ImageElement from "./ImageElement";
import ImagePreload from "./ImagePreload";
import { resolveConfig, useImageConfig } from "./Image.config";
import type {
  ImageProps,
  ImgPropsResult,
  PlaceholderValue,
} from "./Image.types";
import { getImgProps } from "./Image.utils";

// ─── 组件 ─────────────────────────────────────────────────────────────────────

/**
 * <Image> 组件
 *
 * 与 Next.js Image 功能对等：
 * - 自动 srcSet 生成
 * - blur placeholder 支持
 * - fill 模式
 * - priority preload
 * - 开发环境警告
 */
export const Image: Component<ImageProps> = (props) => {
  const contextConfig = useImageConfig();

  // 合并并预计算配置（memoized via SolidJS 细粒度响应式）
  const config = resolveConfig(contextConfig);

  // ── 本地状态 ──────────────────────────────────────────────────────────────
  const [blurComplete, setBlurComplete] = createSignal(false);
  const [showAltText, setShowAltText] = createSignal(false);

  // ── 派生属性 ──────────────────────────────────────────────────────────────
  // getImgProps 将 ImageProps 转换为原生 img 可接受的属性集
  const result = createMemo(
    (): ImgPropsResult =>
      getImgProps(props, {
        imgConf: config,
        blurComplete: blurComplete(),
        showAltText: showAltText(),
      }),
  );

  const imgAttributes = () => result().props;
  const imgMeta = () => result().meta;

  return (
    <>
      <ImageElement
        {...imgAttributes()}
        unoptimized={imgMeta().unoptimized}
        placeholder={imgMeta().placeholder as PlaceholderValue}
        fill={imgMeta().fill}
        onLoad={props.onLoad}
        onLoadingComplete={props.onLoadingComplete}
        setBlurComplete={setBlurComplete}
        setShowAltText={setShowAltText}
        sizesInput={props.sizes}
      />

      <Show when={imgMeta().preload}>
        <ImagePreload imgAttributes={imgAttributes()} />
      </Show>
    </>
  );
};
