/**
 * blur placeholder 的 SVG 生成与背景样式计算。
 *
 * 单一职责：把 blur 数据与目标尺寸转换成可直接写进 `style` 的 CSS 值。
 */

import type { PlaceholderStyle } from "../Image.types";

/** `object-fit` 里不能直接当 `background-size` 用的值 */
const INVALID_BACKGROUND_SIZE_VALUES = [
  "-moz-initial",
  "fill",
  "none",
  "scale-down",
  undefined,
];

interface BlurSvgOptions {
  widthInt?: number;
  heightInt?: number;
  blurWidth?: number;
  blurHeight?: number;
  blurDataURL: string;
  objectFit?: string;
}

/**
 * 生成内联的 blur SVG（URL 编码为 data URL 的 payload）。
 *
 * 采用与 next/image 相同的手法：把原图按放大 40 倍绘制，再叠加高斯模糊滤镜，
 * 得到"低分辨率占位图"的观感，而不必真的生成缩略图。
 */
export function getImageBlurSvg({
  widthInt,
  heightInt,
  blurWidth,
  blurHeight,
  blurDataURL,
  objectFit,
}: BlurSvgOptions): string {
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

interface PlaceholderOptions {
  /** 已解码完成则不必再显示占位 */
  blurComplete: boolean;
  placeholder: string;
  objectFit?: string;
  objectPosition?: string;
  backgroundImage: string | null;
}

/**
 * 由背景图字符串得到完整的占位样式。
 * 没有背景图（`placeholder="empty"` 或已解码）时返回空对象，不产生多余样式。
 */
export function getPlaceholderStyle({
  backgroundImage,
  objectFit,
  objectPosition,
}: PlaceholderOptions): PlaceholderStyle {
  if (!backgroundImage) return {};

  const backgroundSize = !INVALID_BACKGROUND_SIZE_VALUES.includes(objectFit)
    ? objectFit
    : objectFit === "fill"
      ? "100% 100%" // `fill` 在 background-size 下的等价写法
      : "cover";

  return {
    "background-size": backgroundSize,
    "background-position": objectPosition || "50% 50%",
    "background-repeat": "no-repeat",
    "background-image": backgroundImage,
  };
}
