/**
 * 图片 URL 与 `srcSet` 生成。
 *
 * 单一职责：把「配置 + src + 宽度」变成最终的 URL / `srcSet` / `sizes` 字符串。
 * 不含 props 解析、不含校验、不含样式。
 */

import type {
  ImageConfig,
  ImageLoaderProps,
  ImageLoaderWithConfig,
} from "../Image.types";

/**
 * 默认 loader。
 * - 外部 URL（http/https）原样返回，不经过优化服务
 * - 本地图片追加 `url` / `w` / `q` 参数，交给服务端的 `/_image` 处理
 *
 * 开发环境下缺失 `src` / `width` 会直接抛错，避免静默生成坏 URL。
 */
export function defaultLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  if (import.meta.env.DEV) {
    const missingValues: string[] = [];
    if (!src) missingValues.push("src");
    if (!width) missingValues.push("width");
    if (missingValues.length > 0) {
      throw new Error(
        `[defaultLoader] 缺少必要属性：${missingValues.join(", ")}。` +
          `请确认调用方式正确，或提供自定义 loader。`,
      );
    }
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  const params = new URLSearchParams();
  params.set("url", src);
  params.set("w", String(width));
  if (quality) params.set("q", String(quality));
  return `/_image?${params.toString()}`;
}

interface ImgAttrsData {
  config: ImageConfig;
  src: string;
  unoptimized: boolean;
  loader: ImageLoaderWithConfig;
  width?: number;
  quality?: number;
  sizes?: string;
}

interface ImgAttrsResult {
  src: string;
  srcSet: string | undefined;
  sizes: string | undefined;
}

/**
 * 生成 `src` / `srcSet` / `sizes`。
 * `unoptimized` 时不做任何加工（`srcSet` 与 `sizes` 返回 `undefined`，从 DOM 上消失）。
 */
export function generateImgAttrs({
  config,
  src,
  unoptimized,
  width,
  quality,
  sizes,
  loader,
}: ImgAttrsData): ImgAttrsResult {
  if (unoptimized) {
    return { src, srcSet: undefined, sizes: undefined };
  }

  const { widths, kind } = getWidths(config, width, sizes);
  const last = widths.length - 1;

  return {
    sizes: !sizes && kind === "w" ? "100vw" : sizes,
    srcSet: widths
      .map(
        (w, i) =>
          `${loader({ config, src, quality, width: w })} ${
            kind === "w" ? w : i + 1
          }${kind}`,
      )
      .join(", "),

    // `src` 刻意放在最后：浏览器（尤其 Safari）会按属性出现顺序立即发起请求，
    // 若 `src` 在 `srcSet`/`sizes` 之前，会先请求一次再被替换，造成多余请求。
    src: loader({ config, src, quality, width: widths[last] }),
  };
}

/**
 * 决定要生成哪些宽度，以及 `srcSet` 描述符用 `w` 还是 `x`：
 * - 显式 `sizes`：解析其中的 `vw` 百分比，据此过滤 `deviceSizes`，用 `w`
 * - 未传 `sizes` 但传了 `width`：用 `width` / `2x`，用 `x`
 * - 都没有：直接用 `deviceSizes`，用 `w`
 */
export function getWidths(
  { deviceSizes, allSizes }: ImageConfig,
  width: number | undefined,
  sizes: string | undefined,
): { widths: number[]; kind: "w" | "x" } {
  if (sizes) {
    const viewportWidthRe = /(^|\s)(1?\d?\d)vw/g;
    const percentSizes = [];
    for (
      let match: RegExpExecArray | null;
      // biome-ignore lint/suspicious/noAssignInExpressions: 上游 next 的实现，保持逐字移植
      (match = viewportWidthRe.exec(sizes));
      match
    ) {
      percentSizes.push(Number.parseInt(match[2], 10));
    }
    if (percentSizes.length) {
      const smallestRatio = Math.min(...percentSizes) * 0.01;
      return {
        widths: allSizes.filter((s) => s >= deviceSizes[0] * smallestRatio),
        kind: "w",
      };
    }
    return { widths: allSizes, kind: "w" };
  }
  if (typeof width !== "number") {
    return { widths: deviceSizes, kind: "w" };
  }

  const widths = [
    ...new Set(
      // 3x 屏不给 3x 图：多数标称 3x 的 OLED 屏实际只有绿色子像素是 3x，
      // 渲染上与 2x 无差别却显著增加流量。
      // https://blog.twitter.com/engineering/en_us/topics/infrastructure/2019/capping-image-fidelity-on-ultra-high-resolution-devices.html
      [width, width * 2].map(
        (w) => allSizes.find((p) => p >= w) || allSizes[allSizes.length - 1],
      ),
    ),
  ];
  return { widths, kind: "x" };
}
