import { describe, expect, it } from "vitest";
import { toKebabCase } from "~/utils/string";

describe("toKebabCase", () => {
  it("把 camelCase 转成 kebab-case", () => {
    expect(toKebabCase("backgroundColor")).toBe("background-color");
  });

  it("多个大写字母各自成为单词边界", () => {
    expect(toKebabCase("gridTemplateColumns")).toBe("grid-template-columns");
  });

  it("已是 kebab-case 时保持不变", () => {
    expect(toKebabCase("background-color")).toBe("background-color");
  });

  it("全小写单词保持不变", () => {
    expect(toKebabCase("color")).toBe("color");
    expect(toKebabCase("transform")).toBe("transform");
  });

  it("CSS 自定义属性原样保留，不追加连字符", () => {
    expect(toKebabCase("--brand-color")).toBe("--brand-color");
    expect(toKebabCase("--x")).toBe("--x");
  });

  it("float 保留字映射为 float", () => {
    // getComputedStyle().getPropertyValue() 只认 "float"
    expect(toKebabCase("float")).toBe("float");
  });

  it("cssFloat 归一成 float（JS 别名）", () => {
    expect(toKebabCase("cssFloat")).toBe("float");
  });

  it("首字母大写的厂商前缀补上前置连字符", () => {
    // WebkitTransform -> -webkit-transform（此前两份重复实现这里都是错的）
    expect(toKebabCase("WebkitTransform")).toBe("-webkit-transform");
    expect(toKebabCase("MozAppearance")).toBe("-moz-appearance");
  });

  it("ms 前缀补上前置连字符（唯一全小写的厂商前缀）", () => {
    expect(toKebabCase("msTransform")).toBe("-ms-transform");
    expect(toKebabCase("msFlex")).toBe("-ms-flex");
  });

  it("ms 前缀的多段属性同时处理前缀与单词边界", () => {
    expect(toKebabCase("msTransitionDuration")).toBe("-ms-transition-duration");
  });

  it("带厂商前缀的 CSS 自定义属性仍优先走自定义属性分支", () => {
    expect(toKebabCase("--webkit-x")).toBe("--webkit-x");
  });
});
