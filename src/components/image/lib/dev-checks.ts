/**
 * `getImgProps` 的开发期校验与警告。
 *
 * 单一职责：仅在 `import.meta.env.DEV` 下运行，负责
 * 1. 把非法用法变成**明确抛错**（缺 width/height、placeholder 冲突等）；
 * 2. 对"能用但有问题"的用法发 `warnOnce`（quality 未配置、旧属性、LCP 等）。
 *
 * 生产构建里这些代码会被 `import.meta.env.PROD` 分支裁掉，因此这里所有逻辑
 * 都只服务于开发者体验，不影响运行时语义。
 */

import { warnOnce } from "~/utils";
import type {
  ImageConfig,
  ImageLoaderWithConfig,
  ImageProps,
} from "../Image.types";

/** `loading` 的合法取值（含"未传"，表示交给 `isLazy` 决定） */
export const VALID_LOADING_VALUES = ["lazy", "eager", undefined] as const;

export type ValidLoadingValue = (typeof VALID_LOADING_VALUES)[number];

/** 是否是可用的 loading 值 */
export function isValidLoading(value: unknown): value is ValidLoadingValue {
  return VALID_LOADING_VALUES.includes(value as ValidLoadingValue);
}

interface DevCheckContext {
  /** 已解析出的最终 src（可能是空串） */
  src: string;
  config: ImageConfig;
  loader: ImageLoaderWithConfig;
  fill: boolean;
  /** 解析后的宽高（`NaN` 表示非法） */
  widthInt: number | undefined;
  heightInt: number | undefined;
  qualityInt: number | undefined;
  /** `unoptimized` 的当前值，可能会被本函数改写 */
  unoptimized: boolean;
  /** 生效后的内联样式（用于检测与 `fill` 冲突的宽高） */
  style: ImageProps["style"];
  /** 用户在 placeholder / loading / priority / preload / 旧属性上的原始输入 */
  props: {
    width?: unknown;
    height?: unknown;
    loading?: unknown;
    priority?: boolean;
    preload?: boolean;
    placeholder: string;
    blurDataURL?: string;
  };
  /** 未被子组件消费的剩余属性名（用于探测 `ref` 之类不支持的用法） */
  otherKeys: string[];
  /** next 13 之前的旧属性（有值就发 codemod 提示） */
  legacyProps: Record<string, unknown>;
}

/**
 * 入口：执行全部开发期校验。
 * 返回可能被改写的 `unoptimized`（`src` 为空时会强制为 true）。
 */
export function runDevChecks(ctx: DevCheckContext): boolean {
  let unoptimized = ctx.unoptimized;

  if (ctx.config.output === "export" && !unoptimized) {
    throw new Error(
      `Image Optimization using the default loader is not compatible with \`{ output: 'export' }\`.
    Possible solutions:
      - Remove \`{ output: 'export' }\` and run "next start" to run server mode including the Image Optimization API.
      - Configure \`{ images: { unoptimized: true } }\` in \`next.config.js\` to disable the Image Optimization API.
    Read more: https://nextjs.org/docs/messages/export-image-api`,
    );
  }

  if (!ctx.src) {
    // 没有 src 时无法定位是哪张图，退化为不优化
    unoptimized = true;
  } else {
    assertFillConflicts(ctx);
    assertRequiredDimensions(ctx);
    assertSrcNoControlChars(ctx.src);
  }

  assertLoadingFlags(ctx);
  assertPlaceholder(ctx);

  if (!unoptimized) {
    warnLoaderMissingWidth(ctx);
  }
  warnDeprecatedProps(ctx);

  return unoptimized;
}

/** `fill` 与 style 里的定位/宽高互斥（`fill` 恒为 absolute + 100%） */
function assertFillConflicts({ src, fill, style }: DevCheckContext): void {
  if (!fill) return;

  if (style?.position && style.position !== "absolute") {
    throw new Error(
      `Image with src "${src}" has both "fill" and "style.position" properties. Images with "fill" always use position absolute - it cannot be modified.`,
    );
  }
  if (style?.width && style.width !== "100%") {
    throw new Error(
      `Image with src "${src}" has both "fill" and "style.width" properties. Images with "fill" always use width 100% - it cannot be modified.`,
    );
  }
  if (style?.height && style.height !== "100%") {
    throw new Error(
      `Image with src "${src}" has both "fill" and "style.height" properties. Images with "fill" always use height 100% - it cannot be modified.`,
    );
  }
}

/** `fill` 之外必须显式给出可解析的 width / height */
function assertRequiredDimensions({
  src,
  fill,
  widthInt,
  heightInt,
  props,
}: DevCheckContext): void {
  if (fill) return;

  if (typeof widthInt === "undefined") {
    throw new Error(
      `Image with src "${src}" is missing required "width" property.`,
    );
  }
  if (Number.isNaN(widthInt)) {
    throw new Error(
      `Image with src "${src}" has invalid "width" property. Expected a numeric value in pixels but received "${props.width}".`,
    );
  }
  if (typeof heightInt === "undefined") {
    throw new Error(
      `Image with src "${src}" is missing required "height" property.`,
    );
  }
  if (Number.isNaN(heightInt)) {
    throw new Error(
      `Image with src "${src}" has invalid "height" property. Expected a numeric value in pixels but received "${props.height}".`,
    );
  }
}

/** src 首尾的空格/控制字符会被编码或截断，必须显式报错 */
function assertSrcNoControlChars(src: string): void {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: no-control-regex
  if (/^[\x00-\x20]/.test(src)) {
    throw new Error(
      `Image with src "${src}" cannot start with a space or control character. Use src.trimStart() to remove it or encodeURIComponent(src) to keep it.`,
    );
  }
  // biome-ignore lint/suspicious/noControlCharactersInRegex: no-control-regex
  if (/[\x00-\x20]$/.test(src)) {
    throw new Error(
      `Image with src "${src}" cannot end with a space or control character. Use src.trimEnd() to remove it or encodeURIComponent(src) to keep it.`,
    );
  }
}

/** loading / priority / preload 的合法性与互斥关系 */
function assertLoadingFlags({ src, props }: DevCheckContext): void {
  if (!isValidLoading(props.loading)) {
    throw new Error(
      `Image with src "${src}" has invalid "loading" property. Provided "${String(
        props.loading,
      )}" should be one of ${VALID_LOADING_VALUES.map(String).join(",")}.`,
    );
  }
  if (props.priority && props.loading === "lazy") {
    throw new Error(
      `Image with src "${src}" has both "priority" and "loading='lazy'" properties. Only one should be used.`,
    );
  }
  if (props.preload && props.loading === "lazy") {
    throw new Error(
      `Image with src "${src}" has both "preload" and "loading='lazy'" properties. Only one should be used.`,
    );
  }
  if (props.preload && props.priority) {
    throw new Error(
      `Image with src "${src}" has both "preload" and "priority" properties. Only "preload" should be used.`,
    );
  }
}

/** placeholder 合法性、blur 前置条件、小图+占位的性能提示 */
function assertPlaceholder({
  src,
  props,
  widthInt,
  heightInt,
  config,
  qualityInt,
}: DevCheckContext): void {
  const { placeholder, blurDataURL } = props;

  if (
    placeholder !== "empty" &&
    placeholder !== "blur" &&
    !placeholder.startsWith("data:image/")
  ) {
    throw new Error(
      `Image with src "${src}" has invalid "placeholder" property "${placeholder}".`,
    );
  }

  if (
    placeholder !== "empty" &&
    widthInt &&
    heightInt &&
    widthInt * heightInt < 1600
  ) {
    warnOnce(
      `Image with src "${src}" is smaller than 40x40. Consider removing the "placeholder" property to improve performance.`,
    );
  }

  if (
    qualityInt &&
    config.qualities &&
    !config.qualities.includes(qualityInt)
  ) {
    warnOnce(
      `Image with src "${src}" is using quality "${qualityInt}" which is not configured in images.qualities [${config.qualities.join(", ")}]. Please update your config to [${[...config.qualities, qualityInt].sort().join(", ")}].` +
        `\nRead more: https://nextjs.org/docs/messages/next-image-unconfigured-qualities`,
    );
  }

  if (placeholder === "blur" && !blurDataURL) {
    const VALID_BLUR_EXT = ["jpeg", "png", "webp", "avif"];
    throw new Error(
      `Image with src "${src}" has "placeholder='blur'" property but is missing the "blurDataURL" property.
          Possible solutions:
            - Add a "blurDataURL" property, the contents should be a small Data URL to represent the image
            - Change the "src" property to a static import with one of the supported file types: ${VALID_BLUR_EXT.join(
              ",",
            )} (animated images not supported)
            - Remove the "placeholder" property, effectively no blur effect
          Read more: https://nextjs.org/docs/messages/placeholder-blur-data-url`,
    );
  }
}

/** 已废弃属性的提示（`onLoadingComplete` 与 next 13 之前的写法） */
function warnDeprecatedProps({
  src,
  otherKeys,
  legacyProps,
}: DevCheckContext): void {
  if (hasOther(otherKeys, "onLoadingComplete")) {
    warnOnce(
      `Image with src "${src}" is using deprecated "onLoadingComplete" property. Please use the "onLoad" property instead.`,
    );
  }

  for (const [legacyKey, legacyValue] of Object.entries(legacyProps)) {
    if (legacyValue) {
      warnOnce(
        `Image with src "${src}" has legacy prop "${legacyKey}". Did you forget to run the codemod?` +
          `\nRead more: https://nextjs.org/docs/messages/next-image-upgrade-to-13`,
      );
    }
  }
}

/**
 * loader 没把 width 体现在 URL 里时，说明它没实现宽度变换，
 * 此时应改用 `unoptimized` 而不是默默生成一堆一样大的图。
 */
function warnLoaderMissingWidth({
  src,
  config,
  loader,
  widthInt,
  qualityInt,
}: DevCheckContext): void {
  const urlStr = loader({
    config,
    src,
    width: widthInt || 400,
    quality: qualityInt || 75,
  });
  let url: URL | undefined;
  try {
    url = new URL(urlStr);
  } catch (err) {
    console.error(err);
  }
  if (urlStr === src || (url && url.pathname === src && !url.search)) {
    warnOnce(
      `Image with src "${src}" has a "loader" property that does not implement width. Please implement it or use the "unoptimized" property instead.` +
        `\nRead more: https://nextjs.org/docs/messages/next-image-missing-loader-width`,
    );
  }
}

/** 判断 `others` 里是否存在某个 key（`splitProps` 后剩下的属性集） */
function hasOther(otherKeys: string[], key: string): boolean {
  return otherKeys.includes(key);
}

/** 已上报过的图片信息，供 LCP 观察器查表 */
const allImgs = new Map<
  string,
  { src: string; loading: ValidLoadingValue; placeholder: string }
>();
let perfObserver: PerformanceObserver | undefined;

/**
 * 记录本次渲染的图片，并（首次）注册 LCP 观察器。
 * 目的是在开发环境提示"首屏最大的那张图用了 lazy"。
 */
export function trackImageForLcp(entry: {
  src: string;
  loading: ValidLoadingValue;
  placeholder: string;
}): void {
  if (typeof window === "undefined") return;

  let fullUrl: URL;
  try {
    fullUrl = new URL(entry.src);
  } catch (e) {
    console.error(e);
    fullUrl = new URL(entry.src, window.location.href);
  }
  allImgs.set(fullUrl.href, entry);

  if (perfObserver || !window.PerformanceObserver) return;

  perfObserver = new PerformanceObserver((entryList) => {
    for (const observed of entryList.getEntries()) {
      // @ts-expect-error - missing "LargestContentfulPaint" class with "element" prop
      const imgSrc = observed?.element?.src || "";
      const lcpImage = allImgs.get(imgSrc);
      if (
        lcpImage &&
        lcpImage.loading === "lazy" &&
        lcpImage.placeholder === "empty" &&
        !lcpImage.src.startsWith("data:") &&
        !lcpImage.src.startsWith("blob:")
      ) {
        // https://web.dev/lcp/#measure-lcp-in-javascript
        warnOnce(
          `Image with src "${lcpImage.src}" was detected as the Largest Contentful Paint (LCP). Please add the \`loading="eager"\` property if this image is above the fold.` +
            `\nRead more: https://nextjs.org/docs/app/api-reference/components/image#loading`,
        );
      }
    }
  });
  try {
    perfObserver.observe({ type: "largest-contentful-paint", buffered: true });
  } catch (err) {
    // 记录但不让应用崩溃
    console.error(err);
  }
}

/** 仅供测试：重置模块级状态（观察器与已记录图片） */
export function resetLcpTracking(): void {
  perfObserver?.disconnect();
  perfObserver = undefined;
  allImgs.clear();
}
