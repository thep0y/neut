import { afterEach, describe, expect, it, vi } from "vitest";
import {
  paddingBox,
  parsePx,
  rowGap,
} from "~/components/message-scroller/message-scroller.measure";

/** stub `getComputedStyle` 返回构造好的声明对象（jsdom 不展开 shorthand） */
function stubStyle(style: Record<string, string>) {
  vi.spyOn(window, "getComputedStyle").mockReturnValue(
    style as unknown as CSSStyleDeclaration,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parsePx", () => {
  it("解析带单位的像素值", () => {
    expect(parsePx("12px")).toBe(12);
  });

  it("解析无单位的数字字符串", () => {
    expect(parsePx("8")).toBe(8);
  });

  it("解析小数", () => {
    expect(parsePx("2.5px")).toBe(2.5);
  });

  it("解析负数", () => {
    expect(parsePx("-4px")).toBe(-4);
  });

  it("空字符串与非法值都返回 0", () => {
    expect(parsePx("")).toBe(0);
    expect(parsePx("auto")).toBe(0);
    expect(parsePx("normal")).toBe(0);
  });

  it("Infinity 返回 0（不是有限数）", () => {
    expect(parsePx("Infinity")).toBe(0);
  });
});

describe("paddingBox", () => {
  const el = () => document.createElement("div");

  it("优先使用逻辑属性 paddingBlockStart / paddingBlockEnd", () => {
    stubStyle({ paddingBlockStart: "10px", paddingBlockEnd: "20px" });

    expect(paddingBox(el())).toEqual({ start: 10, end: 20 });
  });

  it("逻辑属性为空时回退到 paddingTop / paddingBottom", () => {
    stubStyle({
      paddingBlockStart: "",
      paddingBlockEnd: "",
      paddingTop: "4px",
      paddingBottom: "6px",
    });

    expect(paddingBox(el())).toEqual({ start: 4, end: 6 });
  });

  it("两者都缺失时视为 0", () => {
    stubStyle({});

    expect(paddingBox(el())).toEqual({ start: 0, end: 0 });
  });
});

describe("rowGap", () => {
  it("元素为 null 时返回 0", () => {
    expect(rowGap(null)).toBe(0);
  });

  it("rowGap 有显式值时直接使用", () => {
    stubStyle({ rowGap: "12px", gap: "20px" });

    expect(rowGap(document.createElement("div"))).toBe(12);
  });

  it("rowGap 为 normal 时回退到 gap 简写", () => {
    stubStyle({ rowGap: "normal", gap: "8px" });

    expect(rowGap(document.createElement("div"))).toBe(8);
  });

  it("rowGap 为 normal 且 gap 也缺失时返回 0", () => {
    stubStyle({ rowGap: "normal", gap: "" });

    expect(rowGap(document.createElement("div"))).toBe(0);
  });
});
