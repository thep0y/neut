/**
 * handle-loading.ts
 * 单一职责：封装图片加载完成后的所有副作用——decode、回调触发、开发环境警告。
 * 纯 TypeScript，不包含任何 JSX 或组件代码。
 */

import { mergeProps, splitProps } from "solid-js";
import { warnOnce } from "~/lib/utils";
import { imageConfigDefault } from "./Image.config";
import type {
  ImageConfig,
  ImageConfigComplete,
  ImageLoaderProps,
  ImageLoaderWithConfig,
  ImageProps,
  ImgProps,
  ImgPropsResult,
  LoadingValue,
  OnLoad,
  OnLoadingComplete,
  PlaceholderStyle,
  PlaceholderValue,
  StaticImageData,
  StaticImport,
  StaticRequire,
} from "./Image.types";

// ─── 类型补充 ─────────────────────────────────────────────────────────────────

/** 用于追踪每个 img 节点已处理的 src，避免重复触发 */
type ImgWithDataProp = HTMLImageElement & { "data-loaded-src"?: string };

// ─── 主函数 ───────────────────────────────────────────────────────────────────

/**
 * 在图片加载/hydrate 后调用。
 * - 使用 img.decode() 确保像素已解码再触发回调
 * - 清除 blur placeholder
 * - 开发环境下输出 fill / sizes 相关警告
 */
export function handleLoading(
  img: ImgWithDataProp,
  placeholder: PlaceholderValue,
  onLoad: OnLoad | undefined,
  onLoadingComplete: OnLoadingComplete | undefined,
  setBlurComplete: (v: boolean) => void,
  unoptimized: boolean,
  sizesInput: string | undefined,
): void {
  const src = img?.src;
  // 同一张图只处理一次
  if (!img || img["data-loaded-src"] === src) return;
  img["data-loaded-src"] = src;

  const p: Promise<void> = "decode" in img ? img.decode() : Promise.resolve();

  p.catch(() => {}).then(() => {
    // 若组件已卸载则提前退出
    if (!img.parentElement || !img.isConnected) return;

    if (placeholder !== "empty") {
      setBlurComplete(true);
    }

    if (onLoad) {
      const event = new Event("load");
      Object.defineProperty(event, "target", { writable: false, value: img });
      onLoad(
        event as Event & { currentTarget: HTMLImageElement; target: Element },
      );
    }

    if (onLoadingComplete) {
      onLoadingComplete(img);
    }

    if (import.meta.env.DEV) {
      warnFillUsage(img, unoptimized, sizesInput);
      warnAspectRatioMismatch(img);
    }
  });
}

// ─── 开发警告辅助 ──────────────────────────────────────────────────────────────

function warnFillUsage(
  img: HTMLImageElement,
  unoptimized: boolean,
  sizesInput: string | undefined,
): void {
  if (img.getAttribute("data-nimg") !== "fill") return;

  const origSrc =
    new URL(img.src, "http://n").searchParams.get("url") || img.src;

  if (!unoptimized) {
    const widthViewportRatio =
      img.getBoundingClientRect().width / window.innerWidth;
    if (widthViewportRatio < 0.6) {
      if (sizesInput === "100vw") {
        console.warn(
          `[Image] src="${origSrc}" 设置了 fill 和 sizes="100vw"，但实际渲染宽度不足视口宽度，请调整 sizes 以提升性能。`,
        );
      } else if (!sizesInput) {
        console.warn(
          `[Image] src="${origSrc}" 设置了 fill 但缺少 sizes 属性，请添加以提升性能。`,
        );
      }
    }
  }

  if (img.parentElement) {
    const { position } = window.getComputedStyle(img.parentElement);
    const valid = ["absolute", "fixed", "relative"];
    if (!valid.includes(position)) {
      console.warn(
        `[Image] src="${origSrc}" 设置了 fill，但父元素 position="${position}"，应为 ${valid.join(" | ")} 之一。`,
      );
    }
  }

  if (img.height === 0) {
    console.warn(
      `[Image] src="${origSrc}" 设置了 fill 且高度为 0，请为父元素设置明确高度。`,
    );
  }
}

function warnAspectRatioMismatch(img: HTMLImageElement): void {
  const heightModified = img.height.toString() !== img.getAttribute("height");
  const widthModified = img.width.toString() !== img.getAttribute("width");
  if (
    (heightModified && !widthModified) ||
    (!heightModified && widthModified)
  ) {
    const origSrc =
      new URL(img.src, "http://n").searchParams.get("url") || img.src;
    console.warn(
      `[Image] src="${origSrc}" 仅修改了 width 或 height 其中之一，请同时添加 width: "auto" 或 height: "auto" 样式以保持宽高比。`,
    );
  }
}

interface GetImgPropsOptions {
  imgConf: ImageConfigComplete;
  blurComplete: boolean;
  showAltText: boolean;
}

export const VALID_LOADING_VALUES = ["lazy", "eager", undefined] as const;
// Object-fit values that are not valid background-size values
const INVALID_BACKGROUND_SIZE_VALUES = [
  "-moz-initial",
  "fill",
  "none",
  "scale-down",
  undefined,
];

let perfObserver: PerformanceObserver | undefined;
const allImgs = new Map<
  string,
  { src: string; loading: LoadingValue; placeholder: PlaceholderValue }
>();

export function getImgProps(
  props: ImageProps,
  { imgConf, blurComplete, showAltText }: GetImgPropsOptions,
): ImgPropsResult {
  const merged = mergeProps(
    {
      // loader: defaultLoader,
      fill: false,
      priority: false,
      preload: false,
      placeholder: "empty",
      unoptimized: imgConf.unoptimized,
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

  let config: ImageConfig;
  const c = imgConf || imageConfigDefault;

  if ("allSizes" in c) {
    config = c as ImageConfig;
  } else {
    const allSizes = [...c.deviceSizes, ...c.imageSizes].sort((a, b) => a - b);
    const deviceSizes = c.deviceSizes.sort((a, b) => a - b);
    const qualities = c.qualities?.sort((a, b) => a - b);
    config = { ...c, allSizes, deviceSizes, qualities };
  }

  if (typeof defaultLoader === "undefined") {
    throw new Error(
      "images.loaderFile detected but the file is missing default export.\nRead more: https://nextjs.org/docs/messages/invalid-images-config",
    );
  }

  let style = local.style;
  let sizes = local.sizes;
  let fill = local.fill;

  const loader: ImageLoaderWithConfig = local.loader || defaultLoader;

  if (local.layout) {
    if (local.layout === "fill") {
      fill = true;
    }
    const layoutToStyle: Record<string, Record<string, string> | undefined> = {
      intrinsic: { maxWidth: "100%", height: "auto" },
      responsive: { width: "100%", height: "auto" },
    };
    const layoutToSizes: Record<string, string | undefined> = {
      responsive: "100vw",
      fill: "100vw",
    };
    const layoutStyle = layoutToStyle[local.layout];
    if (layoutStyle) {
      style = { ...style, ...layoutStyle };
    }
    const layoutSizes = layoutToSizes[local.layout];
    if (layoutSizes && !sizes) {
      sizes = layoutSizes;
    }
  }

  let staticSrc = "";
  let blurDataURL = local.blurDataURL;
  let widthInt = getInt(local.width);
  let heightInt = getInt(local.height);
  let blurWidth: number | undefined;
  let blurHeight: number | undefined;

  if (isStaticImport(local.src)) {
    const staticImageData = isStaticRequire(local.src)
      ? local.src.default
      : local.src;

    if (!staticImageData.src) {
      throw new Error(
        `An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received ${JSON.stringify(
          staticImageData,
        )}`,
      );
    }
    if (!staticImageData.height || !staticImageData.width) {
      throw new Error(
        `An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received ${JSON.stringify(
          staticImageData,
        )}`,
      );
    }

    blurWidth = staticImageData.blurWidth;
    blurHeight = staticImageData.blurHeight;
    blurDataURL = blurDataURL || staticImageData.blurDataURL;
    staticSrc = staticImageData.src;

    if (!fill) {
      if (!widthInt && !heightInt) {
        widthInt = staticImageData.width;
        heightInt = staticImageData.height;
      } else if (widthInt && !heightInt) {
        const ratio = widthInt / staticImageData.width;
        heightInt = Math.round(staticImageData.height * ratio);
      } else if (!widthInt && heightInt) {
        const ratio = heightInt / staticImageData.height;
        widthInt = Math.round(staticImageData.width * ratio);
      }
    }
  }
  const src = typeof local.src === "string" ? local.src : staticSrc;

  let unoptimized = local.unoptimized;
  let isLazy =
    !local.priority &&
    !local.preload &&
    (local.loading === "lazy" || typeof local.loading === "undefined");
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
    // https://developer.mozilla.org/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
    unoptimized = true;
    isLazy = false;
  }
  if (config.unoptimized) {
    unoptimized = true;
  }
  if (!config.dangerouslyAllowSVG && src.split("?", 1)[0].endsWith(".svg")) {
    // Special case to make svg serve as-is to avoid proxying
    // through the built-in Image Optimization API.
    unoptimized = true;
  }

  const qualityInt = getInt(local.quality);

  if (!import.meta.env.PROD) {
    if (config.output === "export" && !unoptimized) {
      throw new Error(
        `Image Optimization using the default loader is not compatible with \`{ output: 'export' }\`.
    Possible solutions:
      - Remove \`{ output: 'export' }\` and run "next start" to run server mode including the Image Optimization API.
      - Configure \`{ images: { unoptimized: true } }\` in \`next.config.js\` to disable the Image Optimization API.
    Read more: https://nextjs.org/docs/messages/export-image-api`,
      );
    }
    if (!src) {
      // React doesn't show the stack trace and there's
      // no `src` to help identify which image, so we
      // instead console.error(ref) during mount.
      unoptimized = true;
    } else {
      if (fill) {
        if (local.width) {
          throw new Error(
            `Image with src "${src}" has both "width" and "fill" properties. Only one should be used.`,
          );
        }
        if (local.height) {
          throw new Error(
            `Image with src "${src}" has both "height" and "fill" properties. Only one should be used.`,
          );
        }
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
      } else {
        if (typeof widthInt === "undefined") {
          throw new Error(
            `Image with src "${src}" is missing required "width" property.`,
          );
        } else if (Number.isNaN(widthInt)) {
          throw new Error(
            `Image with src "${src}" has invalid "width" property. Expected a numeric value in pixels but received "${local.width}".`,
          );
        }
        if (typeof heightInt === "undefined") {
          throw new Error(
            `Image with src "${src}" is missing required "height" property.`,
          );
        } else if (Number.isNaN(heightInt)) {
          throw new Error(
            `Image with src "${src}" has invalid "height" property. Expected a numeric value in pixels but received "${local.height}".`,
          );
        }

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
    }
    if (!VALID_LOADING_VALUES.includes(local.loading)) {
      throw new Error(
        `Image with src "${src}" has invalid "loading" property. Provided "${local.loading}" should be one of ${VALID_LOADING_VALUES.map(
          String,
        ).join(",")}.`,
      );
    }
    if (local.priority && local.loading === "lazy") {
      throw new Error(
        `Image with src "${src}" has both "priority" and "loading='lazy'" properties. Only one should be used.`,
      );
    }
    if (local.preload && local.loading === "lazy") {
      throw new Error(
        `Image with src "${src}" has both "preload" and "loading='lazy'" properties. Only one should be used.`,
      );
    }
    if (local.preload && local.priority) {
      throw new Error(
        `Image with src "${src}" has both "preload" and "priority" properties. Only "preload" should be used.`,
      );
    }
    if (
      local.placeholder !== "empty" &&
      local.placeholder !== "blur" &&
      !local.placeholder.startsWith("data:image/")
    ) {
      throw new Error(
        `Image with src "${src}" has invalid "placeholder" property "${local.placeholder}".`,
      );
    }
    if (local.placeholder !== "empty") {
      if (widthInt && heightInt && widthInt * heightInt < 1600) {
        warnOnce(
          `Image with src "${src}" is smaller than 40x40. Consider removing the "placeholder" property to improve performance.`,
        );
      }
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
    if (local.placeholder === "blur" && !blurDataURL) {
      const VALID_BLUR_EXT = ["jpeg", "png", "webp", "avif"]; // should match next-image-loader

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
    if ("ref" in others) {
      warnOnce(
        `Image with src "${src}" is using unsupported "ref" property. Consider using the "onLoad" property instead.`,
      );
    }

    if (!unoptimized) {
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

    if (local.onLoadingComplete) {
      warnOnce(
        `Image with src "${src}" is using deprecated "onLoadingComplete" property. Please use the "onLoad" property instead.`,
      );
    }

    for (const [legacyKey, legacyValue] of Object.entries({
      layout: local.layout,
      objectFit: local.objectFit,
      objectPosition: local.objectPosition,
      lazyBoundary: local.lazyBoundary,
      lazyRoot: local.lazyRoot,
    })) {
      if (legacyValue) {
        warnOnce(
          `Image with src "${src}" has legacy prop "${legacyKey}". Did you forget to run the codemod?` +
            `\nRead more: https://nextjs.org/docs/messages/next-image-upgrade-to-13`,
        );
      }
    }

    if (
      typeof window !== "undefined" &&
      !perfObserver &&
      window.PerformanceObserver
    ) {
      perfObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // @ts-expect-error - missing "LargestContentfulPaint" class with "element" prop
          const imgSrc = entry?.element?.src || "";
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
        perfObserver.observe({
          type: "largest-contentful-paint",
          buffered: true,
        });
      } catch (err) {
        // Log error but don't crash the app
        console.error(err);
      }
    }
  }

  const imgStyle = Object.assign(
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
  );

  const backgroundImage =
    !blurComplete && local.placeholder !== "empty"
      ? local.placeholder === "blur"
        ? `url("data:image/svg+xml;charset=utf-8,${getImageBlurSvg({
            widthInt,
            heightInt,
            blurWidth,
            blurHeight,
            blurDataURL: blurDataURL || "", // assume not undefined
            objectFit: imgStyle.objectFit,
          })}")`
        : `url("${local.placeholder}")` // assume `data:image/`
      : null;

  const backgroundSize = !INVALID_BACKGROUND_SIZE_VALUES.includes(
    imgStyle.objectFit,
  )
    ? imgStyle.objectFit
    : imgStyle.objectFit === "fill"
      ? "100% 100%" // the background-size equivalent of `fill`
      : "cover";

  const placeholderStyle: PlaceholderStyle = backgroundImage
    ? {
        "background-size": backgroundSize,
        "background-position": imgStyle.objectPosition || "50% 50%",
        "background-repeat": "no-repeat",
        "background-image": backgroundImage,
      }
    : {};

  if (import.meta.env.DEV) {
    if (
      placeholderStyle["background-image"] &&
      local.placeholder === "blur" &&
      blurDataURL?.startsWith("/")
    ) {
      // During `next dev`, we don't want to generate blur placeholders with webpack
      // because it can delay starting the dev server. Instead, `next-image-loader.js`
      // will inline a special url to lazily generate the blur placeholder at request time.
      placeholderStyle["background-image"] = `url("${blurDataURL}")`;
    }
  }

  const imgAttributes = generateImgAttrs({
    config,
    src,
    unoptimized,
    width: widthInt,
    quality: qualityInt,
    sizes,
    loader,
  });

  const loadingFinal = isLazy ? "lazy" : local.loading;

  if (!import.meta.env.PROD) {
    if (typeof window !== "undefined") {
      let fullUrl: URL;
      try {
        fullUrl = new URL(imgAttributes.src);
      } catch (e) {
        console.error(e);
        fullUrl = new URL(imgAttributes.src, window.location.href);
      }
      allImgs.set(fullUrl.href, {
        src,
        loading: loadingFinal,
        placeholder: local.placeholder,
      });
    }
  }

  const newProps: ImgProps = {
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
  };
  const meta = {
    unoptimized,
    preload: local.preload || local.priority,
    placeholder: local.placeholder,
    fill,
  };
  return { props: newProps, meta };
}

function defaultLoader({ src, width, quality }: ImageLoaderProps): string {
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

  // 如果 src 本身已是带参数的 URL（外部图片），直接返回
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // 本地图片：追加 w / q 参数（供自定义服务器处理）
  const params = new URLSearchParams();
  params.set("url", src);
  params.set("w", String(width));
  if (quality) params.set("q", String(quality));
  return `/_image?${params.toString()}`;
}

function getInt(x: unknown): number | undefined {
  if (typeof x === "undefined") {
    return x;
  }
  if (typeof x === "number") {
    return Number.isFinite(x) ? x : NaN;
  }
  if (typeof x === "string" && /^[0-9]+$/.test(x)) {
    return parseInt(x, 10);
  }
  return NaN;
}

function isStaticRequire(
  src: StaticRequire | StaticImageData,
): src is StaticRequire {
  return (src as StaticRequire).default !== undefined;
}

function isStaticImageData(
  src: StaticRequire | StaticImageData,
): src is StaticImageData {
  return (src as StaticImageData).src !== undefined;
}

function isStaticImport(src: string | StaticImport): src is StaticImport {
  return (
    !!src &&
    typeof src === "object" &&
    (isStaticRequire(src as StaticImport) ||
      isStaticImageData(src as StaticImport))
  );
}

function getImageBlurSvg({
  widthInt,
  heightInt,
  blurWidth,
  blurHeight,
  blurDataURL,
  objectFit,
}: {
  widthInt?: number;
  heightInt?: number;
  blurWidth?: number;
  blurHeight?: number;
  blurDataURL: string;
  objectFit?: string;
}): string {
  const std = 20;
  const svgWidth = blurWidth ? blurWidth * 40 : widthInt;
  const svgHeight = blurHeight ? blurHeight * 40 : heightInt;

  const viewBox =
    svgWidth && svgHeight ? `viewBox='0 0 ${svgWidth} ${svgHeight}'` : "";
  const preserveAspectRatio = viewBox
    ? "none"
    : objectFit === "contain"
      ? "xMidYMid"
      : objectFit === "cover"
        ? "xMidYMid slice"
        : "none";

  return `%3Csvg xmlns='http://www.w3.org/2000/svg' ${viewBox}%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='${std}'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='${std}'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='${preserveAspectRatio}' style='filter: url(%23b);' href='${blurDataURL}'/%3E%3C/svg%3E`;
}

type GenImgAttrsData = {
  config: ImageConfig;
  src: string;
  unoptimized: boolean;
  loader: ImageLoaderWithConfig;
  width?: number;
  quality?: number;
  sizes?: string;
};

type GenImgAttrsResult = {
  src: string;
  srcSet: string | undefined;
  sizes: string | undefined;
};

function generateImgAttrs({
  config,
  src,
  unoptimized,
  width,
  quality,
  sizes,
  loader,
}: GenImgAttrsData): GenImgAttrsResult {
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

    // It's intended to keep `src` the last attribute because React updates
    // attributes in order. If we keep `src` the first one, Safari will
    // immediately start to fetch `src`, before `sizes` and `srcSet` are even
    // updated by React. That causes multiple unnecessary requests if `srcSet`
    // and `sizes` are defined.
    // This bug cannot be reproduced in Chrome or Firefox.
    src: loader({ config, src, quality, width: widths[last] }),
  };
}

function getWidths(
  { deviceSizes, allSizes }: ImageConfig,
  width: number | undefined,
  sizes: string | undefined,
): { widths: number[]; kind: "w" | "x" } {
  if (sizes) {
    // Find all the "vw" percent sizes used in the sizes prop
    const viewportWidthRe = /(^|\s)(1?\d?\d)vw/g;
    const percentSizes = [];
    for (
      let match: RegExpExecArray | null;
      // biome-ignore lint/suspicious/noAssignInExpressions: nextjs code
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
      // > This means that most OLED screens that say they are 3x resolution,
      // > are actually 3x in the green color, but only 1.5x in the red and
      // > blue colors. Showing a 3x resolution image in the app vs a 2x
      // > resolution image will be visually the same, though the 3x image
      // > takes significantly more data. Even true 3x resolution screens are
      // > wasteful as the human eye cannot see that level of detail without
      // > something like a magnifying glass.
      // https://blog.twitter.com/engineering/en_us/topics/infrastructure/2019/capping-image-fidelity-on-ultra-high-resolution-devices.html
      [width, width * 2 /*, width * 3*/].map(
        (w) => allSizes.find((p) => p >= w) || allSizes[allSizes.length - 1],
      ),
    ),
  ];
  return { widths, kind: "x" };
}
