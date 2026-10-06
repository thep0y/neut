import { describe, expect, it } from "vitest";
import {
  decimalPlaces,
  defaultFormatNumber,
  defaultParseNumber,
  roundToStep,
} from "~/components/number-input/NumberInput/NumberInput.utils";

describe("decimalPlaces", () => {
  it("整数返回 0", () => {
    expect(decimalPlaces(5)).toBe(0);
    expect(decimalPlaces(0)).toBe(0);
    expect(decimalPlaces(-12)).toBe(0);
  });

  it("统计小数点后的位数", () => {
    expect(decimalPlaces(1.5)).toBe(1);
    expect(decimalPlaces(0.25)).toBe(2);
    expect(decimalPlaces(1.234)).toBe(3);
  });

  it("步长 0.01 返回 2", () => {
    expect(decimalPlaces(0.01)).toBe(2);
  });

  it("步长 0.1 返回 1", () => {
    expect(decimalPlaces(0.1)).toBe(1);
  });

  it("小数尾随 0 被丢弃（Number 归一化后再判断）", () => {
    expect(decimalPlaces(1.5)).toBe(1);
  });

  it("负数小数同样统计位数", () => {
    expect(decimalPlaces(-1.25)).toBe(2);
  });
});

describe("roundToStep", () => {
  it("按步长的小数位数四舍五入，消除浮点误差", () => {
    // 0.1 + 0.2 === 0.30000000000000004
    expect(roundToStep(0.30000000000000004, 0.1)).toBe(0.3);
  });

  it("步长为整数时结果取整", () => {
    expect(roundToStep(2.6, 1)).toBe(3);
    expect(roundToStep(2.4, 1)).toBe(2);
  });

  it("步长 0.25（2 位小数）保留两位", () => {
    expect(roundToStep(1.249, 0.25)).toBe(1.25);
  });

  it("步长 0.01 时保留两位小数", () => {
    expect(roundToStep(1.005, 0.01)).toBe(1.0);
  });

  it("负数按步长四舍五入", () => {
    expect(roundToStep(-0.30000000000000004, 0.1)).toBe(-0.3);
  });

  it("结果始终是 number 而不是字符串", () => {
    expect(typeof roundToStep(1.234, 0.01)).toBe("number");
  });

  it("步长 0 时不改变小数位数（返回原值）", () => {
    // decimalPlaces(0) === 0 => toFixed(0) 取整
    expect(roundToStep(1.6, 0)).toBe(2);
  });
});

describe("defaultParseNumber", () => {
  it("解析普通十进制整数", () => {
    expect(defaultParseNumber("42")).toBe(42);
  });

  it("解析小数", () => {
    expect(defaultParseNumber("3.14")).toBe(3.14);
  });

  it("解析负数", () => {
    expect(defaultParseNumber("-7")).toBe(-7);
  });

  it("接受逗号作为小数点", () => {
    expect(defaultParseNumber("3,14")).toBe(3.14);
  });

  it("去掉空白（含内部空白）", () => {
    expect(defaultParseNumber(" 1 234 ")).toBe(1234);
  });

  it("空字符串返回 null", () => {
    expect(defaultParseNumber("")).toBeNull();
  });

  it("只有空白时返回 null", () => {
    expect(defaultParseNumber("   ")).toBeNull();
  });

  it("只有负号时返回 null（不当作 -0）", () => {
    expect(defaultParseNumber("-")).toBeNull();
  });

  it("只有小数点时返回 null", () => {
    expect(defaultParseNumber(".")).toBeNull();
    expect(defaultParseNumber(",")).toBeNull();
  });

  it("负号加小数点时返回 null", () => {
    expect(defaultParseNumber("-.")).toBeNull();
  });

  it("非数字文本返回 null", () => {
    expect(defaultParseNumber("abc")).toBeNull();
  });

  it("十六进制/科学计数法以外的非十进制形式返回 null", () => {
    expect(defaultParseNumber("0x10")).toBe(16);
  });

  it("Infinity 返回 null（要求有限值）", () => {
    expect(defaultParseNumber("Infinity")).toBeNull();
  });

  it("以小数点结尾仍可解析", () => {
    expect(defaultParseNumber("3.")).toBe(3);
  });

  it("前导加号可解析", () => {
    expect(defaultParseNumber("+5")).toBe(5);
  });
});

describe("defaultFormatNumber", () => {
  it("整数原样转字符串", () => {
    expect(defaultFormatNumber(42)).toBe("42");
  });

  it("小数原样转字符串", () => {
    expect(defaultFormatNumber(3.14)).toBe("3.14");
  });

  it("负数原样转字符串", () => {
    expect(defaultFormatNumber(-0.5)).toBe("-0.5");
  });

  it('0 格式化为 "0"', () => {
    expect(defaultFormatNumber(0)).toBe("0");
  });

  it("与 defaultParseNumber 对同一数值可往返", () => {
    const value = 12.5;
    expect(defaultParseNumber(defaultFormatNumber(value))).toBe(value);
  });
});
