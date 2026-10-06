/**
 * `getImgProps`：把 `<Image>` 的 props 解析成原生 `<img>` 可用的属性集。
 *
 * 单一职责：**编排**各专项模块的结果——
 * - 静态导入识别 / 数值解析 → `./lib/static-import`
 * - URL 与 srcSet 生成 → `./lib/loader`
 * - blur 占位样式 → `./lib/blur`
 * - 开发期校验与警告 → `./lib/dev-checks`
 * - 加载完成后的副作用 → `./lib/handle-loading`
 *
 * 本文件不再自己实现上述任何一项，只负责顺序、默认值与最终 `props` / `meta` 组装。
 */

import { mergeProps, splitProps } from "solid-js";
import { imageConfigDefault } from "./Image.config";
import type {
  ImageConfig,
  ImageConfigComplete,
  ImageLoaderWithConfig,
  ImageProps,
  ImgProps,
  ImgPropsResult,
  PlaceholderStyle,
  StaticImport,
} from "./Image.types";
import { getImageBlurSvg, getPlaceholderStyle } from "./lib/blur";
import {
  runDevChecks,
  trackImageForLcp,
  type ValidLoadingValue,
} from "./lib/dev-checks";
import { defaultLoader, generateImgAttrs } from "./lib/loader";
import { getInt, isStaticRequire, isStaticImport } from "./lib/static-import";

// 保持既有导入路径可用：`ImageElement` 从本模块拿 `handleLoading`，
// `Image.types` 从本模块拿 `VALID_LOADING_VALUES` 的类型。
export { handleLoading } from "./lib/handle-loading";
export { VALID_LOADING_VALUES } from "./lib/dev-checks";

export interface GetImgPropsOptions {
  /** 省略时使用内置默认配置（与 ImageConfigProvider 的默认值一致） */
  imgConf?: ImageConfigComplete;
  blurComplete: boolean;
  showAltText: boolean;
}

/**
 * 解析 `<Image>` 的 props。
 *
 * 流程：合并默认值 → 规范化 config → 解析静态导入 → 决定 unoptimized/lazy →
 * 开发期校验 → 计算样式与占位 → 生成 `src`/`srcSet` → 组装结果。
 */
export function getImgProps(
  props: ImageProps,
  { imgConf, blurComplete, showAltText }: GetImgPropsOptions,
): ImgPropsResult {
  // 先解析配置：下面合并 props 默认值时要读 config.unoptimized
  const config = normalizeConfig(imgConf ?? imageConfigDefault);

  const merged = mergeProps(
    {
      fill: false,
      priority: false,
      preload: false,
      placeholder: "empty",
      unoptimized: config.unoptimized,
      decoding: "async",
    } as const,
    props,
  );

  const [local, others] = splitProps(merged, [
    "src",
    "loader",
    "quality",
    "width",
    "height",
    "fill",
    "sizes",
    "priority",
    "placeholder",
    "blurDataURL",
    "unoptimized",
    "overrideSrc",
    "onLoad",
    "onLoadingComplete",
    "layout",
    "style",
    "preload",
    "loading",
    "objectFit",
    "objectPosition",
    "lazyBoundary",
    "lazyRoot",
    "fetchpriority",
    "class",
    "decoding",
  ]);

  const loader: ImageLoaderWithConfig = local.loader || defaultLoader;
  const { style, sizes, fill } = resolveLayout(local);

  // 静态导入（`import img from "./x.png"`）决定 src 与推导出的宽高
  const stat = resolveStaticImport(local, fill);
  const widthInt = stat.widthInt;
  const heightInt = stat.heightInt;
  const blurDataURL = local.blurDataURL || stat.blurDataURL;

  const src = typeof local.src === "string" ? local.src : stat.src;
  const qualityInt = getInt(local.quality);

  // unoptimized / lazy 的推导：data:、blob:、config.unoptimized、.svg 都跳过优化
  let unoptimized = computeUnoptimized(local, config, src);
  const isLazy = computeIsLazy(local, src);

  if (!import.meta.env.PROD) {
    unoptimized = runDevChecks({
      src,
      config,
      loader,
      fill,
      widthInt,
      heightInt,
      qualityInt,
      unoptimized,
      style,
      props: {
        width: local.width,
        height: local.height,
        loading: local.loading,
        priority: local.priority,
        preload: local.preload,
        placeholder: local.placeholder,
        blurDataURL,
      },
      otherKeys: Object.keys(others),
      legacyProps: {
        layout: local.layout,
        objectFit: local.objectFit,
        objectPosition: local.objectPosition,
        lazyBoundary: local.lazyBoundary,
        lazyRoot: local.lazyRoot,
      },
    });
  }

  const imgStyle = computeImgStyle({ fill, showAltText, style, local });
  const placeholderStyle = computePlaceholderStyle({
    blurComplete,
    placeholder: local.placeholder,
    blurDataURL,
    stat,
    widthInt,
    heightInt,
    imgStyle,
  });

  const imgAttributes = generateImgAttrs({
    config,
    src,
    unoptimized,
    width: widthInt,
    quality: qualityInt,
    sizes,
    loader,
  });

  const loadingFinal = isLazy ? "lazy" : (local.loading as ValidLoadingValue);

  if (!import.meta.env.PROD) {
    trackImageForLcp({
      src: imgAttributes.src,
      loading: loadingFinal,
      placeholder: local.placeholder,
    });
  }

  return {
    props: buildImgProps({
      others,
      loadingFinal,
      local,
      widthInt,
      heightInt,
      imgStyle,
      placeholderStyle,
      imgAttributes,
    }),
    meta: {
      unoptimized,
      preload: local.preload || local.priority,
      placeholder: local.placeholder,
      fill,
    },
  };
}

// ─── 私有步骤 ─────────────────────────────────────────────────────────────────

/** 合并 deviceSizes / imageSizes 得到 allSizes，并按升序排列（不改动入参） */
export function normalizeConfig(
  c: ImageConfig | ImageConfigComplete,
): ImageConfig {
  if ("allSizes" in c) return c as ImageConfig;
  return {
    ...c,
    allSizes: [...c.deviceSizes, ...c.imageSizes].sort((a, b) => a - b),
    deviceSizes: [...c.deviceSizes].sort((a, b) => a - b),
    qualities: c.qualities ? [...c.qualities].sort((a, b) => a - b) : undefined,
  };
}

interface LayoutResult {
  style: ImageProps["style"];
  sizes: string | undefined;
  fill: boolean;
}

/**
 * 处理遗留的 `layout` prop。它是 next 12 的写法，这里翻译成
 * `fill` / `sizes` / `style` 三者的等价组合。
 */
function resolveLayout(local: {
  layout?: ImageProps["layout"];
  style?: ImageProps["style"];
  sizes?: string;
  /** 调用方（getImgProps）已通过 mergeProps 保证默认值为 false，故此处必填 */
  fill: boolean;
}): LayoutResult {
  let style = local.style;
  let sizes = local.sizes;
  let fill = local.fill;

  const layout = local.layout;
  if (!layout) return { style, sizes, fill };
  if (layout === "fill") fill = true;

  const layoutToStyle: Record<string, Record<string, string> | undefined> = {
    intrinsic: { maxWidth: "100%", height: "auto" },
    responsive: { width: "100%", height: "auto" },
  };
  const layoutToSizes: Record<string, string | undefined> = {
    responsive: "100vw",
    fill: "100vw",
  };

  const layoutStyle = layoutToStyle[layout];
  if (layoutStyle) style = { ...style, ...layoutStyle };
  const layoutSizes = layoutToSizes[layout];
  if (layoutSizes && !sizes) sizes = layoutSizes;

  return { style, sizes, fill };
}

interface StaticResolution {
  src: string;
  widthInt: number | undefined;
  heightInt: number | undefined;
  blurDataURL: string | undefined;
  blurWidth: number | undefined;
  blurHeight: number | undefined;
}

/**
 * 解析静态导入：拿到 src、blur 数据，并在调用方未指定宽高时按原图比例推导。
 *
 * 注意：`fill` 下不做推导（宽高由容器决定），否则填充图会被推导出固定尺寸。
 */
function resolveStaticImport(
  local: {
    src: string | StaticImport;
    width?: string | number;
    height?: string | number;
  },
  fill: boolean,
): StaticResolution {
  const result: StaticResolution = {
    src: "",
    widthInt: getInt(local.width),
    heightInt: getInt(local.height),
    blurDataURL: undefined,
    blurWidth: undefined,
    blurHeight: undefined,
  };

  if (!isStaticImport(local.src)) return result;

  const data = isStaticRequire(local.src) ? local.src.default : local.src;

  if (!data.src) {
    throw new Error(
      `An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received ${JSON.stringify(
        data,
      )}`,
    );
  }
  if (!data.height || !data.width) {
    throw new Error(
      `An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received ${JSON.stringify(
        data,
      )}`,
    );
  }

  result.src = data.src;
  result.blurWidth = data.blurWidth;
  result.blurHeight = data.blurHeight;
  result.blurDataURL = data.blurDataURL;

  if (!fill) {
    if (!result.widthInt && !result.heightInt) {
      result.widthInt = data.width;
      result.heightInt = data.height;
    } else if (result.widthInt && !result.heightInt) {
      result.heightInt = Math.round(
        data.height * (result.widthInt / data.width),
      );
    } else if (!result.widthInt && result.heightInt) {
      result.widthInt = Math.round(
        data.width * (result.heightInt / data.height),
      );
    }
  }

  return result;
}

/**
 * 判断是否跳过图片优化服务。
 *
 * 三种情况必须跳过：
 * - `data:` / `blob:` URL（无法被服务端处理）
 * - 配置里全局 `unoptimized`
 * - SVG 且未显式允许（走优化服务会被代理，反而出问题）
 */
function computeUnoptimized(
  local: { unoptimized?: boolean },
  config: ImageConfig,
  src: string,
): boolean {
  if (local.unoptimized) return true;
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return true;
  if (config.unoptimized) return true;
  if (!config.dangerouslyAllowSVG && src.split("?", 1)[0].endsWith(".svg")) {
    return true;
  }
  return false;
}

/**
 * 是否给 `<img>` 加 `loading="lazy"`。
 * `priority` / `preload` 表示"首屏关键图"，必须立即加载；
 * `data:` / `blob:` 不占网络请求，也不需要 lazy。
 */
function computeIsLazy(
  local: { priority?: boolean; preload?: boolean; loading?: string },
  src: string,
): boolean {
  if (local.priority || local.preload) return false;
  if (local.loading === "eager") return false;
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return false;
  return true;
}

/** 最终内联样式的类型：由 `Object.assign` 合并出来的 CSS 属性集合 */
type ImgStyle = NonNullable<ImageProps["style"]>;

interface ImgStyleOptions {
  fill: boolean;
  showAltText: boolean;
  style: ImageProps["style"];
  local: { objectFit?: string; objectPosition?: string };
}

/**
 * 组装最终内联样式。
 * - `fill` 时补齐绝对定位与 100% 宽高（`object-fit` / `object-position` 透传）
 * - 不显示 alt 文本时用 `color: transparent` 隐藏浏览器自带的替代文字
 * - 调用方传入的 `style` 最后合并，优先级最高
 */
function computeImgStyle({
  fill,
  showAltText,
  style,
  local,
}: ImgStyleOptions): ImgStyle {
  return Object.assign(
    fill
      ? {
          position: "absolute",
          height: "100%",
          width: "100%",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          objectFit: local.objectFit,
          objectPosition: local.objectPosition,
        }
      : {},
    showAltText ? {} : { color: "transparent" },
    style,
  ) as ImgStyle;
}

interface PlaceholderOptions {
  blurComplete: boolean;
  placeholder: string;
  blurDataURL: string | undefined;
  stat: StaticResolution;
  widthInt: number | undefined;
  heightInt: number | undefined;
  imgStyle: ImgStyle;
}

/** 计算占位背景图（blur SVG 或自定义 data URL），再交给 `lib/blur` 生成样式 */
function computePlaceholderStyle({
  blurComplete,
  placeholder,
  blurDataURL,
  stat,
  widthInt,
  heightInt,
  imgStyle,
}: PlaceholderOptions): PlaceholderStyle {
  // 已解码完成或 placeholder=empty 时不显示占位
  if (blurComplete || placeholder === "empty") return {};

  const objectFit = imgStyle["object-fit"] as string | undefined;
  const objectPosition = imgStyle["object-position"] as string | undefined;

  const backgroundImage =
    placeholder === "blur"
      ? `url("data:image/svg+xml;charset=utf-8,${getImageBlurSvg({
          widthInt,
          heightInt,
          blurWidth: stat.blurWidth,
          blurHeight: stat.blurHeight,
          blurDataURL,
          objectFit,
        })}")`
      : `url("${placeholder}")`; // 形如 data:image/...

  return getPlaceholderStyle({
    blurComplete,
    placeholder,
    objectFit,
    objectPosition,
    backgroundImage,
  });
}

interface BuildPropsOptions {
  others: Record<string, unknown>;
  loadingFinal: ValidLoadingValue;
  local: {
    fetchpriority?: ImageProps["fetchpriority"];
    decoding?: string;
    class?: string;
    overrideSrc?: string;
  };
  widthInt: number | undefined;
  heightInt: number | undefined;
  imgStyle: ImgStyle;
  placeholderStyle: PlaceholderStyle;
  imgAttributes: {
    src: string;
    srcSet: string | undefined;
    sizes: string | undefined;
  };
}

/** 组装最终写进 `<img>` 的属性集 */
function buildImgProps({
  others,
  loadingFinal,
  local,
  widthInt,
  heightInt,
  imgStyle,
  placeholderStyle,
  imgAttributes,
}: BuildPropsOptions): ImgProps {
  return {
    ...others,
    loading: loadingFinal,
    fetchpriority: local.fetchpriority,
    width: widthInt,
    height: heightInt,
    decoding: local.decoding,
    class: local.class,
    style: { ...imgStyle, ...placeholderStyle },
    sizes: imgAttributes.sizes,
    srcSet: imgAttributes.srcSet,
    src: local.overrideSrc || imgAttributes.src,
  } as ImgProps;
}
