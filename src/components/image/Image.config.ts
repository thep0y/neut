/**
 * image-config.ts
 * 单一职责：提供图片配置的默认值，以及通过 SolidJS Context 向下传递配置的机制。
 * 不包含任何渲染逻辑。
 */

import { createContext, useContext } from "solid-js";
import type { ImageConfigComplete } from "./Image.types";

// ─── 默认配置 ─────────────────────────────────────────────────────────────────

export const imageConfigDefault: ImageConfigComplete = {
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  loader: "default",
  path: "/_next/image",
  loaderFile: "",
  domains: [],
  disableStaticImages: false,
  minimumCacheTTL: 60,
  formats: ["image/webp"],
  dangerouslyAllowSVG: false,
  contentSecurityPolicy: `script-src 'none'; frame-src 'none'; sandbox;`,
  contentDispositionType: "attachment",
  remotePatterns: [],
  unoptimized: false,
};

// ─── SolidJS Context ──────────────────────────────────────────────────────────

/**
 * 向子树提供自定义图片配置。
 * 用法：
 *   <ImageConfigProvider value={myConfig}>
 *     <App />
 *   </ImageConfigProvider>
 */
export const ImageConfigContext =
  createContext<ImageConfigComplete>(imageConfigDefault);

export function useImageConfig(): ImageConfigComplete {
  return useContext(ImageConfigContext);
}

// ─── 配置合并工具 ──────────────────────────────────────────────────────────────

/**
 * 将上下文配置与运行时注入的配置合并，
 * 并预计算派生字段（allSizes、排序后的 deviceSizes / qualities）。
 */
export function resolveConfig(
  contextConfig: ImageConfigComplete,
  envConfig?: Partial<ImageConfigComplete>,
): ImageConfigComplete {
  const c: ImageConfigComplete = { ...contextConfig, ...(envConfig ?? {}) };

  const allSizes = [...c.deviceSizes, ...c.imageSizes].sort((a, b) => a - b);
  const deviceSizes = [...c.deviceSizes].sort((a, b) => a - b);
  const qualities = c.qualities
    ? [...c.qualities].sort((a, b) => a - b)
    : undefined;

  return { ...c, allSizes, deviceSizes, qualities };
}
