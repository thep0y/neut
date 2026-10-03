import { describe, expect, it } from "vitest";
import {
  resolveColumnKeyAction,
  resolveNextOptionIndex,
  resolveNextUnit,
} from "~/components/time-picker/TimePickerColumn/time-picker.column-utils";

describe("resolveNextOptionIndex", () => {
  it("空列表返回 -1（调用方放弃）", () => {
    expect(resolveNextOptionIndex(-1, 1, 0)).toBe(-1);
  });

  it("当前值不在列表里：向下从第一项、向上从最后一项开始", () => {
    expect(resolveNextOptionIndex(-1, 1, 4)).toBe(0);
    expect(resolveNextOptionIndex(-1, -1, 4)).toBe(3);
  });

  it("中间位置按方向推进", () => {
    expect(resolveNextOptionIndex(1, 1, 4)).toBe(2);
    expect(resolveNextOptionIndex(1, -1, 4)).toBe(0);
  });

  it("首尾环形回绕", () => {
    expect(resolveNextOptionIndex(3, 1, 4)).toBe(0);
    expect(resolveNextOptionIndex(0, -1, 4)).toBe(3);
  });

  it("只有一项时原地不动", () => {
    expect(resolveNextOptionIndex(0, 1, 1)).toBe(0);
    expect(resolveNextOptionIndex(0, -1, 1)).toBe(0);
  });
});

describe("resolveNextUnit", () => {
  const units = ["hour", "minute", "second"] as const;

  it("当前列不在列表中时返回 undefined", () => {
    expect(
      resolveNextUnit(units, "meridiem" as never, 1, false),
    ).toBeUndefined();
  });

  it("空列表返回 undefined", () => {
    expect(resolveNextUnit([], "hour" as never, 1, false)).toBeUndefined();
  });

  it("LTR：向右推进、向左回退", () => {
    expect(resolveNextUnit(units, "hour", 1, false)).toBe("minute");
    expect(resolveNextUnit(units, "minute", -1, false)).toBe("hour");
  });

  it("LTR：首尾环形回绕", () => {
    expect(resolveNextUnit(units, "second", 1, false)).toBe("hour");
    expect(resolveNextUnit(units, "hour", -1, false)).toBe("second");
  });

  it("RTL：左右方向语义取反", () => {
    expect(resolveNextUnit(units, "hour", 1, true)).toBe("second");
    expect(resolveNextUnit(units, "hour", -1, true)).toBe("minute");
  });

  it("只有一列时返回自身", () => {
    expect(resolveNextUnit(["hour"] as const, "hour", 1, false)).toBe("hour");
  });
});

describe("resolveColumnKeyAction", () => {
  it.each([
    ["ArrowDown", { type: "move", direction: 1 }],
    ["ArrowUp", { type: "move", direction: -1 }],
    ["ArrowRight", { type: "moveColumn", direction: 1 }],
    ["ArrowLeft", { type: "moveColumn", direction: -1 }],
    ["Home", { type: "commitBoundary", boundary: "first" }],
    ["End", { type: "commitBoundary", boundary: "last" }],
    ["Enter", { type: "consume" }],
    [" ", { type: "consume" }],
  ])("%s 映射为对应意图", (key, expected) => {
    expect(resolveColumnKeyAction(key)).toEqual(expected);
  });

  it("其它按键返回 null", () => {
    expect(resolveColumnKeyAction("a")).toBeNull();
    expect(resolveColumnKeyAction("Escape")).toBeNull();
  });
});
