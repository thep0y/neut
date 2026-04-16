// ─── 图片加载器 ───────────────────────────────────────────────────────────────

import type { JSX } from "solid-js";
import type { VALID_LOADING_VALUES } from "./Image.utils";

export interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
  blurWidth?: number;
  blurHeight?: number;
}

export interface StaticRequire {
  default: StaticImageData;
}

export type StaticImport = StaticRequire | StaticImageData;

export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export type ImageConfig = ImageConfigComplete & {
  allSizes: number[];
  output?: "standalone" | "export";
};

export type ImageLoader = (props: ImageLoaderProps) => string;

export type ImageLoaderPropsWithConfig = ImageLoaderProps & {
  config: Readonly<ImageConfig>;
};
// Do not export - this is an internal type only
// because `next.config.js` is only meant for the
// built-in loaders, not for a custom loader() prop.
export type ImageLoaderWithConfig = (p: ImageLoaderPropsWithConfig) => string;

// ─── 占位符 ───────────────────────────────────────────────────────────────────

export type PlaceholderValue = "blur" | "empty" | `data:image/${string}`;

// ─── 回调 ─────────────────────────────────────────────────────────────────────

/**
 * 图片加载完成后触发，接收一个类似 React SyntheticEvent 的对象。
 * SolidJS 中直接使用原生 Event 即可。
 */
export type OnLoad = (
  event: Event & { currentTarget: HTMLImageElement; target: Element },
) => void;
// export type OnLoad = JSX.IntrinsicElements["img"]["onLoad"];

/** @deprecated 使用 onLoad 替代 */
export type OnLoadingComplete = (img: HTMLImageElement) => void;

// ─── 图片配置 ─────────────────────────────────────────────────────────────────

export interface ImageConfigComplete {
  deviceSizes: number[];
  imageSizes: number[];
  loader: "default" | "imgix" | "cloudinary" | "akamai" | "custom";
  path: string;
  loaderFile: string;
  domains: string[];
  disableStaticImages: boolean;
  minimumCacheTTL: number;
  formats: ("image/avif" | "image/webp")[];
  dangerouslyAllowSVG: boolean;
  contentSecurityPolicy: string;
  contentDispositionType: "inline" | "attachment";
  remotePatterns: RemotePattern[];
  localPatterns?: LocalPattern[];
  unoptimized: boolean;
  qualities?: number[];
  /** 由运行时计算追加 */
  allSizes?: number[];
}

export interface RemotePattern {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
  search?: string;
}

export interface LocalPattern {
  pathname?: string;
  search?: string;
}

// ─── 组件 Props ───────────────────────────────────────────────────────────────

export type LoadingValue = (typeof VALID_LOADING_VALUES)[number];

/** 公开的 <Image> 组件 Props */
export interface ImageProps
  extends Omit<
    JSX.IntrinsicElements["img"],
    | "src"
    | "srcSet"
    | "ref"
    | "alt"
    | "width"
    | "height"
    | "loading"
    | "style"
    | "onLoad"
  > {
  style?: JSX.CSSProperties;
  src: string | StaticImport;
  alt: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  fill?: boolean;
  loader?: ImageLoader;
  quality?: number | `${number}`;
  preload?: boolean;
  onLoad?: OnLoad;
  /**
   * @deprecated Use `preload` prop instead.
   * See https://nextjs.org/docs/app/api-reference/components/image#preload
   */
  priority?: boolean;
  loading?: LoadingValue;
  placeholder?: PlaceholderValue;
  blurDataURL?: string;
  unoptimized?: boolean;
  overrideSrc?: string;
  /**
   * @deprecated Use `onLoad` instead.
   * @see https://nextjs.org/docs/app/api-reference/components/image#onload
   */
  onLoadingComplete?: OnLoadingComplete;
  /**
   * @deprecated Use `fill` prop instead of `layout="fill"` or change import to `next/legacy/image`.
   * @see https://nextjs.org/docs/api-reference/next/legacy/image
   */
  layout?: string;
  /**
   * @deprecated Use `style` prop instead.
   */
  objectFit?: string;
  /**
   * @deprecated Use `style` prop instead.
   */
  objectPosition?: string;
  /**
   * @deprecated This prop does not do anything.
   */
  lazyBoundary?: string;
  /**
   * @deprecated This prop does not do anything.
   */
  lazyRoot?: string;
}

export type ImgProps = Omit<ImageProps, "src" | "loader"> & {
  loading: LoadingValue;
  width: number | undefined;
  height: number | undefined;
  style: NonNullable<JSX.IntrinsicElements["img"]["style"]>;
  sizes: string | undefined;
  srcSet: string | undefined;
  src: string;
};

/** getImgProps 的返回结构 */
export interface ImgPropsResult {
  props: ImgProps;
  meta: {
    unoptimized: boolean;
    placeholder: PlaceholderValue;
    fill: boolean;
    preload: boolean;
  };
}

export type PlaceholderStyle = Partial<
  Pick<
    JSX.CSSProperties,
    | "background-size"
    | "background-position"
    | "background-repeat"
    | "background-image"
  >
>;
