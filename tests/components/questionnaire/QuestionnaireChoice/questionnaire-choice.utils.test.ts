import { describe, expect, it } from "vitest";
import {
  decideChoiceSelectionChange,
  isChoiceRequired,
  resolveChoiceChecked,
  resolveChoiceName,
  resolveChoiceShortcut,
} from "~/components/questionnaire/QuestionnaireChoice/questionnaire-choice.utils";

describe("resolveChoiceChecked", () => {
  it("受控且未跳过时以受控值为准", () => {
    expect(
      resolveChoiceChecked({
        controlled: true,
        status: "answered",
        selectedAnswerIds: [],
        id: "a",
      }),
    ).toBe(true);
  });

  it("受控但已跳过时一律不勾选", () => {
    expect(
      resolveChoiceChecked({
        controlled: true,
        status: "skipped",
        selectedAnswerIds: ["a"],
        id: "a",
      }),
    ).toBe(false);
  });

  it("非受控时看选中集合", () => {
    expect(
      resolveChoiceChecked({
        controlled: undefined,
        status: "answered",
        selectedAnswerIds: ["a", "b"],
        id: "a",
      }),
    ).toBe(true);
    expect(
      resolveChoiceChecked({
        controlled: undefined,
        status: "answered",
        selectedAnswerIds: ["b"],
        id: "a",
      }),
    ).toBe(false);
  });
});

describe("isChoiceRequired", () => {
  it("必填、单选、没有文本框作答时才需要原生 required", () => {
    expect(
      isChoiceRequired({ required: true, multiple: false, hasInputAnswer: false }),
    ).toBe(true);
  });

  it.each([
    ["整题非必填", { required: false, multiple: false, hasInputAnswer: false }],
    ["多选", { required: true, multiple: true, hasInputAnswer: false }],
    ["本题有文本框作答", { required: true, multiple: false, hasInputAnswer: true }],
  ])("%s 时不需要", (_name, options) => {
    expect(isChoiceRequired(options)).toBe(false);
  });
});

describe("resolveChoiceName", () => {
  it("未跳过时使用题目名", () => {
    expect(resolveChoiceName("answered", "q1")).toBe("q1");
  });

  it("已跳过时不提交字段名", () => {
    expect(resolveChoiceName("skipped", "q1")).toBeUndefined();
  });
});

describe("decideChoiceSelectionChange", () => {
  it("用户回调已取消时不写回", () => {
    expect(
      decideChoiceSelectionChange({
        canceled: true,
        controlled: undefined,
        status: "answered",
        checked: true,
      }),
    ).toBeNull();
  });

  it("非受控时采用原生勾选结果", () => {
    expect(
      decideChoiceSelectionChange({
        canceled: false,
        controlled: undefined,
        status: "answered",
        checked: true,
      }),
    ).toBe(true);
    expect(
      decideChoiceSelectionChange({
        canceled: false,
        controlled: undefined,
        status: "answered",
        checked: false,
      }),
    ).toBe(false);
  });

  it("受控且已跳过、原生结果与受控值相同时补一次写回", () => {
    expect(
      decideChoiceSelectionChange({
        canceled: false,
        controlled: true,
        status: "skipped",
        checked: true,
      }),
    ).toBe(true);
  });

  it("受控且已跳过、但原生结果与受控值不同时不写回", () => {
    expect(
      decideChoiceSelectionChange({
        canceled: false,
        controlled: true,
        status: "skipped",
        checked: false,
      }),
    ).toBeNull();
  });

  it("受控且未跳过时交给受控方，自己不写", () => {
    expect(
      decideChoiceSelectionChange({
        canceled: false,
        controlled: false,
        status: "answered",
        checked: true,
      }),
    ).toBeNull();
  });
});

describe("resolveChoiceShortcut", () => {
  it("声明式 value 映射优先", () => {
    expect(
      resolveChoiceShortcut({
        byChoiceValue: new Map([["one", "A"]]),
        byAnswerId: new Map([["id-1", "B"]]),
        value: "one",
        id: "id-1",
      }),
    ).toBe("A");
  });

  it("没有声明式映射时按答案 id 分配", () => {
    expect(
      resolveChoiceShortcut({
        byChoiceValue: null,
        byAnswerId: new Map([["id-1", "B"]]),
        value: "one",
        id: "id-1",
      }),
    ).toBe("B");
  });

  it("声明式映射里没有该 value 时回退到 id 映射", () => {
    expect(
      resolveChoiceShortcut({
        byChoiceValue: new Map([["other", "A"]]),
        byAnswerId: new Map([["id-1", "C"]]),
        value: "one",
        id: "id-1",
      }),
    ).toBe("C");
  });

  it("两套映射都没有时返回 null", () => {
    expect(
      resolveChoiceShortcut({
        byChoiceValue: null,
        byAnswerId: new Map(),
        value: "one",
        id: "id-1",
      }),
    ).toBeNull();
  });
});
