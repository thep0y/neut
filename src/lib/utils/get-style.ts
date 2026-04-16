function toKebabCase(str: string): string {
  // 处理特殊属性名
  if (str === "float" || str === "cssFloat") return "float";

  // 处理前缀为大写的情况（如 WebkitTransform）
  return (
    str
      .replace(/[A-Z]/g, (match, offset) =>
        offset === 0 ? match.toLowerCase() : `-${match.toLowerCase()}`,
      )
      // 处理 ms 前缀（IE/Edge 特定）
      .replace(/^ms-/, "-ms-")
  );
}

/**
 * 获取目标元素指定 CSS 属性的计算值（最终应用到元素上的样式值）
 * @param element 目标 DOM 元素
 * @param property CSS 属性名（支持驼峰或连字符形式，如 'backgroundColor' 或 'background-color'）
 * @returns 属性的计算值字符串，获取失败时返回 null
 *
 * @example
 * const element = document.getElementById('myDiv');
 * const color = getStyleValue(element, 'color');
 * const bgColor = getStyleValue(element, 'background-color');
 * const borderRadius = getStyleValue(element, 'borderRadius');
 */
function getStyleValue(
  element: Element | null,
  property: string,
): string | null {
  // 环境检查：确保在浏览器环境中运行
  if (typeof window === "undefined" || !window.getComputedStyle) {
    console.warn("getStyleValue: 当前环境不支持 getComputedStyle API");
    return null;
  }

  // 参数校验
  if (!element) {
    console.warn("getStyleValue: 提供的元素无效（null 或 undefined）");
    return null;
  }

  if (typeof property !== "string" || property.trim() === "") {
    console.warn("getStyleValue: 属性名必须是非空字符串");
    return null;
  }

  try {
    // 获取元素的计算样式对象
    const computedStyle = window.getComputedStyle(element);

    // 将属性名统一转换为连字符形式以兼容 getPropertyValue 方法
    const kebabProperty = toKebabCase(property.trim());

    // 获取属性值（若属性不存在则返回空字符串）
    const value = computedStyle.getPropertyValue(kebabProperty);

    // 返回获取到的样式值（空字符串表示该属性未定义或无值）
    return value || null;
  } catch (error) {
    console.error(`getStyleValue: 获取样式值时发生错误 - ${error}`);
    return null;
  }
}

export default getStyleValue;
