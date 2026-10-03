import { describe, expect, it } from "vitest";
import {
  getInt,
  isStaticImageData,
  isStaticImport,
  isStaticRequire,
} from "~/components/image/lib/static-import";

describe("getInt", () => {
  it("undefined 原样返回（表示未提供）", () => {
    expect(getInt(undefined)).toBeUndefined();
  });

  it("有限数字原样返回", () => {
    expect(getInt(0)).toBe(0);
    expect(getInt(320)).toBe(320);
    expect(getInt(-5)).toBe(-5);
  });

  it("非有限数字返回 NaN（表示非法）", () => {
    expect(getInt(Number.POSITIVE_INFINITY)).toBeNaN();
    expect(getInt(Number.NEGATIVE_INFINITY)).toBeNaN();
    expect(getInt(Number.NaN)).toBeNaN();
  });

  it("纯数字字符串按十进制解析", () => {
    expect(getInt("640")).toBe(640);
    expect(getInt("0")).toBe(0);
  });

  it("带小数点的字符串不解析（返回 NaN）", () => {
    expect(getInt("1.5")).toBeNaN();
  });

  it("带正负号或空格的字符串不解析", () => {
    expect(getInt("+10")).toBeNaN();
    expect(getInt("-10")).toBeNaN();
    expect(getInt(" 10")).toBeNaN();
    expect(getInt("10 ")).toBeNaN();
  });

  it("非数字字符串与非法类型返回 NaN", () => {
    expect(getInt("abc")).toBeNaN();
    expect(getInt("")).toBeNaN();
    expect(getInt(null)).toBeNaN();
    expect(getInt({})).toBeNaN();
    expect(getInt(["640"])).toBeNaN();
  });
});

describe("isStaticRequire", () => {
  it("带 default 字段时判定为 true", () => {
    expect(
      isStaticRequire({
        default: { src: "/a.png", width: 1, height: 1 },
      }),
    ).toBe(true);
  });

  it("不带 default 字段时判定为 false", () => {
    expect(isStaticRequire({ src: "/a.png", width: 1, height: 1 })).toBe(false);
  });
});

describe("isStaticImageData", () => {
  it("带 src 字段时判定为 true", () => {
    expect(isStaticImageData({ src: "/a.png", width: 1, height: 1 })).toBe(
      true,
    );
  });

  it("没有 src 字段时判定为 false", () => {
    expect(
      isStaticImageData({
        default: { src: "/a.png", width: 1, height: 1 },
      } as never),
    ).toBe(false);
  });
});

describe("isStaticImport", () => {
  it("字符串 src 不是静态导入", () => {
    expect(isStaticImport("/a.png")).toBe(false);
  });

  it("空字符串 / null / undefined 不是静态导入", () => {
    expect(isStaticImport("")).toBe(false);
    expect(isStaticImport(undefined as never)).toBe(false);
    expect(isStaticImport(null as never)).toBe(false);
  });

  it("StaticImageData 形态被识别", () => {
    expect(isStaticImport({ src: "/a.png", width: 1, height: 1 })).toBe(true);
  });

  it("StaticRequire 形态被识别", () => {
    expect(
      isStaticImport({ default: { src: "/a.png", width: 1, height: 1 } }),
    ).toBe(true);
  });

  it("既无 src 也无 default 的普通对象不被识别", () => {
    expect(isStaticImport({ foo: "bar" } as never)).toBe(false);
  });

  it("数字等非对象类型不被识别", () => {
    expect(isStaticImport(42 as never)).toBe(false);
  });
});
