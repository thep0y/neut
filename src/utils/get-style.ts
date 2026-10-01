import { toKebabCase } from "./string";

/**
 * 获取目标元素指定 CSS 属性的计算值(最终应用到元素上的样式值)。
 * @param element 目标 DOM 元素
 * @param property CSS 属性名(支持驼峰或连字符形式,如 'backgroundColor' / 'background-color')
 * @returns 属性的计算值字符串,获取失败时返回 null
 *
 * @example
 * const el = document.getElementById('myDiv');
 * getStyleValue(el, 'color');
 * getStyleValue(el, 'backgroundColor');
 */
export function getStyleValue(
  element: Element | null,
  property: string,
): string | null {
  // 环境检查:确保在浏览器环境中运行
  if (typeof window === "undefined" || !window.getComputedStyle) {
    console.warn("getStyleValue: 当前环境不支持 getComputedStyle API");
    return null;
  }

  if (!element) {
    console.warn("getStyleValue: 提供的元素无效(null 或 undefined)");
    return null;
  }

  if (typeof property !== "string" || property.trim() === "") {
    console.warn("getStyleValue: 属性名必须是非空字符串");
    return null;
  }

  try {
    const computedStyle = window.getComputedStyle(element);
    // 统一转成连字符形式,兼容 getPropertyValue 的取值约定
    const value = computedStyle.getPropertyValue(toKebabCase(property.trim()));
    // 空字符串表示该属性未定义或无值
    return value || null;
  } catch (error) {
    console.error(`getStyleValue: 获取样式值时发生错误 - ${error}`);
    return null;
  }
}
