import { renderHook } from "@solidjs/testing-library";
import { createSignal, type Accessor } from "solid-js";
import { describe, expect, it } from "vitest";
import { createAnswerBookkeeping } from "~/components/questionnaire/questionnaire.answers";
import type { QuestionnaireAnswerEntry } from "~/components/questionnaire/questionnaire.context";

function control(
  type: "choice" | "input",
  options: { elementType?: string; disabled?: boolean; value?: string } = {},
): QuestionnaireAnswerEntry {
  const element = document.createElement(
    type === "input" ? "input" : "input",
  ) as HTMLInputElement;
  element.type = options.elementType ?? (type === "input" ? "text" : "radio");
  if (options.value !== undefined) element.value = options.value;
  if (options.disabled) element.disabled = true;
  return { id: `id-${Math.random()}`, element, type, disabled: false };
}

function setup(initial: { multiple?: boolean; required?: boolean } = {}) {
  const [multiple, setMultiple] = createSignal(initial.multiple ?? false);
  const [required, setRequired] = createSignal(initial.required ?? false);

  const hook = renderHook(() =>
    createAnswerBookkeeping({
      multiple: multiple as Accessor<boolean>,
      required: required as Accessor<boolean>,
    }),
  );

  return { ...hook, setMultiple, setRequired };
}

describe("createAnswerBookkeeping 注册答案控件", () => {
  it("注册后可按元素反查", () => {
    const { result } = setup();
    const entry = control("choice");

    result.registerAnswerControl(entry);

    expect(result.answers()).toEqual([entry]);
    expect(result.getAnswerByElement(entry.element)).toBe(entry);
  });

  it("未注册的元素反查为 null", () => {
    const { result } = setup();

    expect(
      result.getAnswerByElement(document.createElement("input")),
    ).toBeNull();
  });

  it("同 id 或同元素重复注册时替换（不追加）", () => {
    const { result } = setup();
    const element = document.createElement("input");
    const first: QuestionnaireAnswerEntry = {
      id: "same",
      element,
      type: "choice",
      disabled: false,
    };
    const second: QuestionnaireAnswerEntry = {
      id: "same",
      element,
      type: "choice",
      disabled: false,
    };

    result.registerAnswerControl(first);
    result.registerAnswerControl(second);

    expect(result.answers()).toEqual([second]);
  });

  it("注销后移出列表", () => {
    const { result } = setup();
    const unregister = result.registerAnswerControl(control("choice"));

    unregister();

    expect(result.answers()).toEqual([]);
  });
});

describe("createAnswerBookkeeping hasInputAnswer", () => {
  it("有文本框类答案时为 true", () => {
    const { result } = setup();

    result.registerAnswerControl(control("input", { elementType: "text" }));

    expect(result.hasInputAnswer()).toBe(true);
  });

  it.each(["button", "checkbox", "radio", "reset", "submit"])(
    "%s 不算文本框作答",
    (elementType) => {
      const { result } = setup();

      result.registerAnswerControl(
        control("input", { elementType, value: "v" }),
      );

      expect(result.hasInputAnswer()).toBe(false);
    },
  );

  it("没有答案时为 false", () => {
    const { result } = setup();

    expect(result.hasInputAnswer()).toBe(false);
  });
});

describe("createAnswerBookkeeping 选中解析", () => {
  it("单选：选中新项会替换旧项", () => {
    const { result } = setup({ multiple: false });
    const a = control("choice");
    const b = control("choice");
    result.registerAnswerControl(a);
    result.registerAnswerControl(b);

    result.setAnswerSelectionFromInteraction(a.id, true);
    result.setAnswerSelectionFromInteraction(b.id, true);

    expect(result.selections()).toEqual([b.id]);
  });

  it("多选：选中新项会累加，重复选中保持原值", () => {
    const { result } = setup({ multiple: true });
    const a = control("choice");
    const b = control("choice");
    result.registerAnswerControl(a);
    result.registerAnswerControl(b);

    result.setAnswerSelectionFromInteraction(a.id, true);
    result.setAnswerSelectionFromInteraction(b.id, true);
    result.setAnswerSelectionFromInteraction(b.id, true);

    expect(result.selections()).toEqual([a.id, b.id]);
  });

  it("取消选中会移出集合", () => {
    const { result } = setup({ multiple: true });
    const a = control("choice");
    result.registerAnswerControl(a);
    result.setAnswerSelectionFromInteraction(a.id, true);

    result.setAnswerSelectionFromInteraction(a.id, false);

    expect(result.selections()).toEqual([]);
  });

  it("registerAnswerSelection 的初始选中：单选只认第一个", () => {
    const { result } = setup({ multiple: false });

    result.registerAnswerSelection("a", true);
    result.registerAnswerSelection("b", true);

    expect(result.selections()).toEqual(["a"]);
  });

  it("registerAnswerSelection 的初始选中：多选累加且不重复", () => {
    const { result } = setup({ multiple: true });

    result.registerAnswerSelection("a", true);
    result.registerAnswerSelection("a", true);
    result.registerAnswerSelection("b", true);

    expect(result.selections()).toEqual(["a", "b"]);
  });

  it("初始未选中时不写入", () => {
    const { result } = setup();

    result.registerAnswerSelection("a", false);

    expect(result.selections()).toEqual([]);
  });

  it("注销会同时清掉选中与默认值", () => {
    const { result } = setup({ multiple: true });
    const unregister = result.registerAnswerSelection("a", true);
    result.setAnswerDefault("a", true);

    unregister();

    expect(result.selections()).toEqual([]);
    expect(result.defaults()).toEqual([]);
  });

  it("受控同步走与交互相同的选中规则", () => {
    const { result } = setup({ multiple: false });
    result.syncControlledAnswerSelection("a", true);

    expect(result.selections()).toEqual(["a"]);

    result.syncControlledAnswerSelection("a", false);
    expect(result.selections()).toEqual([]);
  });
});

describe("createAnswerBookkeeping 默认值", () => {
  it("设置默认值：重复设置只出现一次", () => {
    const { result } = setup();

    result.setAnswerDefault("a", true);
    result.setAnswerDefault("a", true);

    expect(result.defaults()).toEqual(["a"]);
  });

  it("取消默认值会移出", () => {
    const { result } = setup();
    result.setAnswerDefault("a", true);

    result.setAnswerDefault("a", false);

    expect(result.defaults()).toEqual([]);
  });
});

describe("createAnswerBookkeeping status", () => {
  it("没有选中任何答案时未作答", () => {
    const { result } = setup();

    expect(result.status()).toBe("unanswered");
    expect(result.answeredOk()).toBe(false);
  });

  it("选中的答案控件可用时算已作答", () => {
    const { result } = setup();
    const a = control("choice");
    result.registerAnswerControl(a);

    result.setAnswerSelectionFromInteraction(a.id, true);

    expect(result.status()).toBe("answered");
    expect(result.answeredOk()).toBe(true);
  });

  it("选中的答案控件被禁用时仍算未作答", () => {
    const { result } = setup();
    const a = control("choice", { disabled: true });
    result.registerAnswerControl(a);

    result.setAnswerSelectionFromInteraction(a.id, true);

    expect(result.status()).toBe("unanswered");
  });

  it("跳过时状态为 skipped", () => {
    const { result } = setup();
    const a = control("choice");
    result.registerAnswerControl(a);
    result.setAnswerSelectionFromInteraction(a.id, true);

    result.skip();

    expect(result.status()).toBe("skipped");
    expect(result.selections()).toEqual([]);
  });

  it("必填题目不允许跳过", () => {
    const { result } = setup({ required: true });

    expect(result.skip()).toBe(false);
    expect(result.status()).toBe("unanswered");
  });

  it("跳过后再次作答会取消跳过", () => {
    const { result } = setup();
    const a = control("choice");
    result.registerAnswerControl(a);
    result.skip();

    result.setAnswerSelectionFromInteraction(a.id, true);

    expect(result.status()).toBe("answered");
  });

  it("skippable 只在已跳过且非必填时为 true", () => {
    const { result, setRequired } = setup();
    expect(result.skippable()).toBe(false);

    result.skip();
    expect(result.skippable()).toBe(true);

    setRequired(true);
    expect(result.skippable()).toBe(false);
  });
});

describe("createAnswerBookkeeping reset / touched", () => {
  it("touched 初始为 false，markTouched 后为 true", () => {
    const { result } = setup();

    expect(result.touched()).toBe(false);
    result.markTouched();
    expect(result.touched()).toBe(true);
  });

  it("单选 reset 回到第一个默认值", () => {
    const { result } = setup({ multiple: false });
    result.setAnswerDefault("a", true);
    result.setAnswerDefault("b", true);
    result.setAnswerSelectionFromInteraction("b", true);

    result.reset();

    expect(result.selections()).toEqual(["a"]);
  });

  it("多选 reset 回到全部默认值", () => {
    const { result } = setup({ multiple: true });
    result.setAnswerDefault("a", true);
    result.setAnswerDefault("b", true);

    result.reset();

    expect(result.selections()).toEqual(["a", "b"]);
  });

  it("reset 会复位 touched / skipped 并自增 resetVersion", () => {
    const { result } = setup();
    result.markTouched();
    result.skip();
    const before = result.resetVersion();

    result.reset();

    expect(result.touched()).toBe(false);
    expect(result.status()).toBe("unanswered");
    expect(result.resetVersion()).toBe(before + 1);
  });
});
