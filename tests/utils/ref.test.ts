import { describe, expect, it, vi } from "vitest";
import { mergeRefs } from "~/utils/ref";

describe("mergeRefs", () => {
  it("依次调用所有传入的函数 ref", () => {
    const first = vi.fn();
    const second = vi.fn();
    const el = document.createElement("div");

    mergeRefs(first, second)(el);

    expect(first).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledWith(el);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(el);
  });

  it("跳过 undefined 项，只调用函数 ref", () => {
    const ref = vi.fn();
    const el = document.createElement("div");

    // Solid 编译器会把对象 ref 规整成回调再转发，这里模拟规范化的入参
    expect(() =>
      mergeRefs(ref, undefined, undefined as never)(el),
    ).not.toThrow();
    expect(ref).toHaveBeenCalledWith(el);
  });

  it("调用顺序与传入顺序一致", () => {
    const calls: string[] = [];
    const el = document.createElement("div");

    mergeRefs(
      () => calls.push("first"),
      () => calls.push("second"),
      () => calls.push("third"),
    )(el);

    expect(calls).toEqual(["first", "second", "third"]);
  });
});
