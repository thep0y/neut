/**
 * 静态图片导入的识别与数值解析。
 *
 * 单一职责：只处理「src 到底是字符串还是静态导入对象」以及「宽高/quality 这类
 * 松散输入怎么解析成数字」。不涉及 loader、样式或校验。
 */

import type {
  StaticImageData,
  StaticImport,
  StaticRequire,
} from "../Image.types";

/**
 * 把 `width` / `height` / `quality` 这类既可传数字也可传数字字符串的输入解析成数字。
 * - `undefined` 原样返回（表示"未提供"，与 `NaN` 表示"非法"区分开）
 * - 纯数字字符串按十进制解析
 * - 其它一律返回 `NaN`，由调用方决定是否抛错
 */
export function getInt(x: unknown): number | undefined {
  if (typeof x === "undefined") {
    return x;
  }
  if (typeof x === "number") {
    return Number.isFinite(x) ? x : Number.NaN;
  }
  if (typeof x === "string" && /^[0-9]+$/.test(x)) {
    return Number.parseInt(x, 10);
  }
  return Number.NaN;
}

/** 是否是 webpack 的 `require().default` 形态 */
export function isStaticRequire(
  src: StaticRequire | StaticImageData,
): src is StaticRequire {
  return (src as StaticRequire).default !== undefined;
}

/** 是否已是 StaticImageData（自带 src/width/height） */
export function isStaticImageData(
  src: StaticRequire | StaticImageData,
): src is StaticImageData {
  return (src as StaticImageData).src !== undefined;
}

/** 是否是任何一种静态导入对象（`require()` 或 `import` 的结果） */
export function isStaticImport(
  src: string | StaticImport,
): src is StaticImport {
  return (
    !!src &&
    typeof src === "object" &&
    (isStaticRequire(src as StaticImport) ||
      isStaticImageData(src as StaticImport))
  );
}
