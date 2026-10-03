import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import {
  buildDescribedBy,
  buildItemKeyshortcuts,
  createIdRegistry,
} from "~/components/questionnaire/questionnaire.aria";

describe("createIdRegistry", () => {
  it("初始为空", () => {
    const { result } = renderHook(() => createIdRegistry());

    expect(result.ids()).toEqual([]);
  });

  it("登记后按顺序保留，重复登记不重复添加", () => {
    const { result } = renderHook(() => createIdRegistry());

    result.register("a");
    result.register("b");
    result.register("a");

    expect(result.ids()).toEqual(["a", "b"]);
  });

  it("注销后移出", () => {
    const { result } = renderHook(() => createIdRegistry());
    const unregister = result.register("a");
    result.register("b");

    unregister();

    expect(result.ids()).toEqual(["b"]);
  });

  it("重复注销是安全的", () => {
    const { result } = renderHook(() => createIdRegistry());
    const unregister = result.register("a");

    unregister();

    expect(() => unregister()).not.toThrow();
    expect(result.ids()).toEqual([]);
  });
});

describe("buildDescribedBy", () => {
  it("没有 id 时返回 undefined（不输出空属性）", () => {
    expect(buildDescribedBy([], [], false)).toBeUndefined();
  });

  it("只有描述 id 时直接拼接", () => {
    expect(buildDescribedBy(["a", "b"], [], false)).toBe("a b");
  });

  it("有效时把错误 id 追加在后面", () => {
    expect(buildDescribedBy(["a"], ["e1", "e2"], true)).toBe("a e1 e2");
  });

  it("无效时不追加错误 id", () => {
    expect(buildDescribedBy(["a"], ["e1"], false)).toBe("a");
  });

  it("只有错误 id 且有效时也输出", () => {
    expect(buildDescribedBy([], ["e1"], true)).toBe("e1");
  });

  it("描述 id 与错误 id 重复时去重", () => {
    expect(buildDescribedBy(["a", "shared"], ["shared"], true)).toBe(
      "a shared",
    );
  });
});

describe("buildItemKeyshortcuts", () => {
  const base = {
    active: true,
    hasAnswers: true,
    first: false,
    last: false,
    status: "answered" as const,
  };

  it("非激活题目不输出快捷键", () => {
    expect(buildItemKeyshortcuts({ ...base, active: false })).toBeUndefined();
  });

  it("激活时始终包含提交组合键", () => {
    const result = buildItemKeyshortcuts({
      ...base,
      hasAnswers: false,
      first: true,
      last: true,
      status: "unanswered",
    });

    expect(result).toBe("Meta+Enter Control+Enter");
  });

  it("有答案控件时提示上下箭头", () => {
    expect(buildItemKeyshortcuts(base)).toContain("ArrowUp ArrowDown");
  });

  it("没有答案控件时不提示上下箭头", () => {
    expect(buildItemKeyshortcuts({ ...base, hasAnswers: false })).not.toContain(
      "ArrowUp",
    );
  });

  it("首题不提示左箭头", () => {
    expect(buildItemKeyshortcuts({ ...base, first: true })).not.toContain(
      "ArrowLeft",
    );
    expect(buildItemKeyshortcuts({ ...base, first: false })).toContain(
      "ArrowLeft",
    );
  });

  it("末题不提示右箭头", () => {
    expect(buildItemKeyshortcuts({ ...base, last: true })).not.toContain(
      "ArrowRight",
    );
  });

  it("未作答时不提示右箭头（右箭头不会前进）", () => {
    expect(
      buildItemKeyshortcuts({ ...base, last: false, status: "unanswered" }),
    ).not.toContain("ArrowRight");
    expect(
      buildItemKeyshortcuts({ ...base, last: false, status: "answered" }),
    ).toContain("ArrowRight");
  });
});
