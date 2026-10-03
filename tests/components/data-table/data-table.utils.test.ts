import { describe, expect, it } from "vitest";
import {
  compareValues,
  includesFilterValue,
} from "~/components/data-table/data-table.utils";

/** 默认比较与默认过滤：表格引擎的兜底行为，必须在没有自定义实现时可用。 */
describe("compareValues", () => {
  it("两个数字按大小比较", () => {
    expect(compareValues(1, 2)).toBeLessThan(0);
    expect(compareValues(2, 1)).toBeGreaterThan(0);
    expect(compareValues(2, 2)).toBe(0);
  });

  it("其它类型按本地化字符串比较", () => {
    expect(compareValues("a", "b")).toBeLessThan(0);
    expect(compareValues("B", "a")).toBeGreaterThan(0);
    expect(compareValues("a", "a")).toBe(0);
  });

  it("数字与字符串混合时也走字符串比较（不会 NaN）", () => {
    expect(Number.isNaN(compareValues(1, "2"))).toBe(false);
    expect(compareValues(10, "9")).toBeLessThan(0); // "10" < "9"
  });

  it("null / undefined 当成空串参与比较", () => {
    expect(compareValues(null, "")).toBe(0);
    expect(compareValues(undefined, null)).toBe(0);
    expect(compareValues(null, "b")).toBeLessThan(0);
  });
});

describe("includesFilterValue", () => {
  it("大小写不敏感地做包含匹配", () => {
    expect(includesFilterValue("Hello World", "hello")).toBe(true);
    expect(includesFilterValue("Hello World", "WORLD")).toBe(true);
    expect(includesFilterValue("Hello", "zzz")).toBe(false);
  });

  it("非字符串值先转成字符串", () => {
    expect(includesFilterValue(123, "2")).toBe(true);
    expect(includesFilterValue(true, "ru")).toBe(true);
  });

  it("null / undefined 安全处理", () => {
    expect(includesFilterValue(null, "a")).toBe(false);
    expect(includesFilterValue(undefined, "")).toBe(true);
    expect(includesFilterValue("abc", null)).toBe(true);
  });
});
