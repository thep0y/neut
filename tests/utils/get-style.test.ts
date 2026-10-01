import { afterEach, describe, expect, it, vi } from "vitest";
import { getStyleValue } from "~/utils/get-style";

describe("getStyleValue", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("读取驼峰写法的 CSS 属性计算值", () => {
    const el = document.createElement("div");
    el.style.color = "rgb(255, 0, 0)";
    document.body.appendChild(el);

    expect(getStyleValue(el, "color")).toBe("rgb(255, 0, 0)");
  });

  it("读取连字符写法的 CSS 属性计算值", () => {
    const el = document.createElement("div");
    el.style.backgroundColor = "rgb(0, 0, 255)";
    document.body.appendChild(el);

    expect(getStyleValue(el, "background-color")).toBe("rgb(0, 0, 255)");
  });

  it("驼峰与连字符两种写法得到同一个值", () => {
    const el = document.createElement("div");
    el.style.borderRadius = "4px";
    document.body.appendChild(el);

    expect(getStyleValue(el, "borderRadius")).toBe(
      getStyleValue(el, "border-radius"),
    );
  });

  it("属性两侧空白会被去掉", () => {
    const el = document.createElement("div");
    el.style.color = "rgb(1, 2, 3)";
    document.body.appendChild(el);

    expect(getStyleValue(el, "  color  ")).toBe("rgb(1, 2, 3)");
  });

  it("元素为 null 时返回 null 并给出警告", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(getStyleValue(null, "color")).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      "getStyleValue: 提供的元素无效(null 或 undefined)",
    );
  });

  it("属性名为空字符串时返回 null 并给出警告", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("div");

    expect(getStyleValue(el, "")).toBeNull();
    expect(warn).toHaveBeenCalledWith("getStyleValue: 属性名必须是非空字符串");
  });

  it("属性名只有空白时同样视为非法", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("div");

    expect(getStyleValue(el, "   ")).toBeNull();
    expect(warn).toHaveBeenCalledWith("getStyleValue: 属性名必须是非空字符串");
  });

  it("未设置的属性返回 null（空字符串归一为 null）", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    expect(getStyleValue(el, "unknown-property")).toBeNull();
  });

  it("环境不支持 getComputedStyle 时返回 null 并给出警告", () => {
    const original = window.getComputedStyle;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // 模拟非浏览器 / 旧环境
    Reflect.deleteProperty(window, "getComputedStyle");

    try {
      expect(getStyleValue(document.createElement("div"), "color")).toBeNull();
      expect(warn).toHaveBeenCalledWith(
        "getStyleValue: 当前环境不支持 getComputedStyle API",
      );
    } finally {
      window.getComputedStyle = original;
    }
  });

  it("getComputedStyle 抛错时捕获并返回 null", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("boom");
    const original = window.getComputedStyle;
    window.getComputedStyle = () => {
      throw boom;
    };

    try {
      expect(getStyleValue(document.createElement("div"), "color")).toBeNull();
      expect(error).toHaveBeenCalledWith(
        `getStyleValue: 获取样式值时发生错误 - ${boom}`,
      );
      expect(warn).not.toHaveBeenCalled();
    } finally {
      window.getComputedStyle = original;
    }
  });

  it("读取厂商前缀属性时按 CSS 规范拼接属性名", () => {
    const el = document.createElement("div");
    const original = window.getComputedStyle;
    const getPropertyValue = vi.fn().mockReturnValue("rotate(45deg)");
    window.getComputedStyle = (() => ({ getPropertyValue })) as never;

    try {
      expect(getStyleValue(el, "WebkitTransform")).toBe("rotate(45deg)");
      // -webkit-transform 而不是此前错误实现产出的 webkit-transform
      expect(getPropertyValue).toHaveBeenCalledWith("-webkit-transform");
    } finally {
      window.getComputedStyle = original;
    }
  });

  it("读取 ms 前缀属性时带上 IE 前缀连字符", () => {
    const el = document.createElement("div");
    const original = window.getComputedStyle;
    const getPropertyValue = vi.fn().mockReturnValue("flex");
    window.getComputedStyle = (() => ({ getPropertyValue })) as never;

    try {
      getStyleValue(el, "msTransform");
      expect(getPropertyValue).toHaveBeenCalledWith("-ms-transform");
    } finally {
      window.getComputedStyle = original;
    }
  });
});
