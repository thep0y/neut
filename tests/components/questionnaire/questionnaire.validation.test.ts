import { describe, expect, it } from "vitest";
import type { QuestionnaireAnswerEntry } from "~/components/questionnaire/questionnaire.context";
import {
  findNativeInvalidAnswer,
  isItemSatisfied,
  resolveItemInvalid,
} from "~/components/questionnaire/questionnaire.validation";

describe("resolveItemInvalid", () => {
  const base = {
    disabled: false,
    invalid: false,
    skippable: false,
    touched: false,
    answeredOk: false,
  };

  it("禁用的题目永不报错", () => {
    expect(resolveItemInvalid({ ...base, disabled: true, touched: true })).toBe(
      false,
    );
  });

  it("已跳过的题目不报错", () => {
    expect(
      resolveItemInvalid({ ...base, skippable: true, touched: true }),
    ).toBe(false);
  });

  it("显式 invalid 立即生效（受控）", () => {
    expect(resolveItemInvalid({ ...base, invalid: true })).toBe(true);
  });

  it("未交互过时不报错", () => {
    expect(resolveItemInvalid({ ...base, touched: false })).toBe(false);
  });

  it("交互过且未满足要求时报错", () => {
    expect(
      resolveItemInvalid({ ...base, touched: true, answeredOk: false }),
    ).toBe(true);
  });

  it("交互过但已满足要求时不报错", () => {
    expect(
      resolveItemInvalid({ ...base, touched: true, answeredOk: true }),
    ).toBe(false);
  });

  it("显式 invalid 且已回答时不报错（以 invalid 为准则报错）", () => {
    // invalid=true 时仍然报错：受控的 invalid 优先于"已回答"
    expect(
      resolveItemInvalid({
        ...base,
        invalid: true,
        touched: true,
        answeredOk: true,
      }),
    ).toBe(true);
  });
});

describe("isItemSatisfied", () => {
  it("禁用视为满足", () => {
    expect(
      isItemSatisfied({
        disabled: true,
        status: "unanswered",
        required: true,
        invalid: true,
      }),
    ).toBe(true);
  });

  it("已跳过且非必填视为满足", () => {
    expect(
      isItemSatisfied({
        disabled: false,
        status: "skipped",
        required: false,
        invalid: false,
      }),
    ).toBe(true);
  });

  it("已跳过但必填不算满足", () => {
    expect(
      isItemSatisfied({
        disabled: false,
        status: "skipped",
        required: true,
        invalid: false,
      }),
    ).toBe(false);
  });

  it("已作答且没有外部 invalid 算满足", () => {
    expect(
      isItemSatisfied({
        disabled: false,
        status: "answered",
        required: true,
        invalid: false,
      }),
    ).toBe(true);
  });

  it("已作答但有外部 invalid 不算满足", () => {
    expect(
      isItemSatisfied({
        disabled: false,
        status: "answered",
        required: false,
        invalid: true,
      }),
    ).toBe(false);
  });

  it("未作答不算满足", () => {
    expect(
      isItemSatisfied({
        disabled: false,
        status: "unanswered",
        required: false,
        invalid: false,
      }),
    ).toBe(false);
  });
});

describe("findNativeInvalidAnswer", () => {
  /** jsdom 的 validity 是只读的，用 defineProperty 造出想要的组合 */
  function answer(options: {
    filled?: boolean;
    willValidate?: boolean;
    valid?: boolean;
  }): QuestionnaireAnswerEntry {
    const element = document.createElement("input");
    element.type = "text";
    // isAnswerFilled 要求输入类控件同时有 name 与值
    if (options.filled) {
      element.setAttribute("name", "q1");
      element.value = "x";
    }
    Object.defineProperty(element, "willValidate", {
      value: options.willValidate ?? true,
      configurable: true,
    });
    Object.defineProperty(element, "validity", {
      value: { valid: options.valid ?? true },
      configurable: true,
    });
    return { id: "a", element, type: "input", disabled: false };
  }

  it("返回第一个有值且原生校验不通过的答案", () => {
    const filledInvalid = answer({ filled: true, valid: false });
    const empty = answer({ filled: false, valid: false });
    const fine = answer({ filled: true, valid: true });

    expect(findNativeInvalidAnswer([empty, filledInvalid, fine])).toBe(
      filledInvalid,
    );
  });

  it("空控件不参与原生报错", () => {
    expect(
      findNativeInvalidAnswer([answer({ filled: false, valid: false })]),
    ).toBeUndefined();
  });

  it("不参与校验的控件被跳过", () => {
    expect(
      findNativeInvalidAnswer([
        answer({ filled: true, valid: false, willValidate: false }),
      ]),
    ).toBeUndefined();
  });

  it("全部合法时返回 undefined", () => {
    expect(
      findNativeInvalidAnswer([
        answer({ filled: true }),
        answer({ filled: true }),
      ]),
    ).toBeUndefined();
  });

  it("空列表返回 undefined", () => {
    expect(findNativeInvalidAnswer([])).toBeUndefined();
  });
});
