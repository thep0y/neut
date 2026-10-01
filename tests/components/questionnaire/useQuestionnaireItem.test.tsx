import { renderHook } from "@solidjs/testing-library";
import { createSignal, type ParentProps } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  QuestionnaireRootContext,
  type QuestionnaireItemHandle,
  type QuestionnaireRootContextValue,
} from "~/components/questionnaire/questionnaire.context";
import { useQuestionnaireItem } from "~/components/questionnaire/useQuestionnaireItem";
import type {
  QuestionnaireRootState,
  QuestionnaireShortcutMode,
} from "~/components/questionnaire/questionnaire.types";

/**
 * `useQuestionnaireItem` 是单题目的状态机：答案注册、选中集合、跳过、
 * 校验、快捷键分配、给 Root 的句柄。
 *
 * 它依赖 `QuestionnaireRootContext`，这里构造受控的假 root 来隔离被测逻辑
 * （与 QuestionnaireInput / QuestionnaireChoice 的测试保持一致的做法）。
 */
function createFakeRootContext() {
  const [activeItemName, setActiveItemName] = createSignal<string | null>("q1");
  const [nativeValidation, setNativeValidation] = createSignal(true);
  const [shortcuts, setShortcuts] =
    createSignal<QuestionnaireShortcutMode | null>(null);
  const [itemDefinitions, setItemDefinitions] = createSignal<Map<
    string,
    { name: string; choices?: Array<{ value: string; disabled?: boolean }> }
  > | null>(null);
  const [state, setState] = createSignal<QuestionnaireRootState>({
    first: false,
    last: false,
  } as QuestionnaireRootState);

  const registeredItems: QuestionnaireItemHandle[] = [];
  const registerItem = vi.fn((handle: QuestionnaireItemHandle) => {
    registeredItems.push(handle);
    return () => {
      const index = registeredItems.indexOf(handle);
      if (index >= 0) registeredItems.splice(index, 1);
    };
  });

  const ctx: QuestionnaireRootContextValue = {
    state,
    activeItemName,
    activeItemRequired: () => null,
    activeItemStatus: () => null,
    shortcuts,
    nativeValidation,
    itemDefinitions: () => itemDefinitions() as never,
    registerItem,
    goNext: vi.fn(),
    goPrevious: vi.fn(),
    skipCurrent: vi.fn(),
    requestSubmit: vi.fn(),
  };

  const wrapper = (props: ParentProps) => (
    <QuestionnaireRootContext.Provider value={ctx}>
      {props.children}
    </QuestionnaireRootContext.Provider>
  );

  return {
    ctx,
    wrapper,
    registerItem,
    registeredItems,
    setActiveItemName,
    setNativeValidation,
    setShortcuts,
    setItemDefinitions,
    setState,
  };
}

function renderItem(
  options: {
    name?: string;
    required?: boolean;
    multiple?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    onStatusChange?: (status: string) => void;
  } = {},
) {
  const root = createFakeRootContext();
  const [required] = createSignal(options.required ?? false);
  const [multiple] = createSignal(options.multiple ?? false);
  const [disabled] = createSignal(options.disabled ?? false);
  const [invalid] = createSignal(options.invalid ?? false);

  const rendered = renderHook(
    () =>
      useQuestionnaireItem({
        name: options.name ?? "q1",
        required,
        multiple,
        disabled,
        invalid,
        onStatusChange: options.onStatusChange as never,
      }),
    { wrapper: root.wrapper },
  );

  return { ...root, ...rendered };
}

/** 造一个 answer control；默认挂到 body 上（isConnected 为 true） */
function makeAnswer(
  type: "choice" | "input",
  overrides: Partial<{
    id: string;
    value: string;
    disabled: boolean;
    elementType: string;
    detached: boolean;
  }> = {},
) {
  const el = document.createElement("input");
  el.type = overrides.elementType ?? (type === "choice" ? "radio" : "text");
  if (!overrides.detached) document.body.appendChild(el);
  return {
    id: overrides.id ?? `a-${Math.random().toString(36).slice(2)}`,
    element: el,
    type,
    value: overrides.value,
    disabled: overrides.disabled ?? false,
  };
}

describe("useQuestionnaireItem - 初始状态", () => {
  it("没有答案时 status 为 unanswered", () => {
    const { result, cleanup } = renderItem();

    expect(result.context.status()).toBe("unanswered");

    cleanup();
  });

  it("name 透传", () => {
    const { result, cleanup } = renderItem({ name: "question-a" });

    expect(result.context.name).toBe("question-a");

    cleanup();
  });

  it("active 由 root.activeItemName 决定", () => {
    const { result, cleanup, setActiveItemName } = renderItem();

    expect(result.context.active()).toBe(true);
    setActiveItemName("other");
    expect(result.context.active()).toBe(false);

    cleanup();
  });

  it("未选中任何答案", () => {
    const { result, cleanup } = renderItem();

    expect(result.context.selectedAnswerIds()).toEqual([]);

    cleanup();
  });
});

describe("useQuestionnaireItem - 答案注册", () => {
  it("注册答案后可被 getAnswerByElement 查到", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const answer = makeAnswer("choice");
    result.context.registerAnswerControl(answer);
    result.registerElement(document.createElement("fieldset"));

    const handle = registeredItems[0];
    expect(handle.getAnswerByElement(answer.element)).toEqual(answer);

    cleanup();
  });

  it("未注册的元素返回 null", () => {
    const { result, cleanup, registeredItems } = renderItem();
    result.registerElement(document.createElement("fieldset"));

    expect(
      registeredItems[0].getAnswerByElement(document.createElement("input")),
    ).toBeNull();

    cleanup();
  });

  it("注销后答案被移除", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const answer = makeAnswer("choice");
    const unregister = result.context.registerAnswerControl(answer);
    result.registerElement(document.createElement("fieldset"));

    unregister();

    expect(registeredItems[0].getAnswerByElement(answer.element)).toBeNull();
    cleanup();
  });

  it("同一元素重复注册只保留一条", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const answer = makeAnswer("choice", { id: "x" });
    const other = { ...answer, id: "y" };
    result.context.registerAnswerControl(answer);
    result.context.registerAnswerControl(other);
    result.registerElement(document.createElement("fieldset"));

    const handle = registeredItems[0];
    expect(handle.getAnswerByElement(answer.element)).toEqual(other);

    cleanup();
  });
});

describe("useQuestionnaireItem - 选中与 status", () => {
  it("选中一个答案后 status 变为 answered", () => {
    const { result, cleanup } = renderItem();
    const answer = makeAnswer("choice");
    result.context.registerAnswerControl(answer);

    result.context.setAnswerSelectionFromInteraction(answer.id, true);

    expect(result.context.status()).toBe("answered");

    cleanup();
  });

  it("取消选中后回到 unanswered", () => {
    const { result, cleanup } = renderItem();
    const answer = makeAnswer("choice");
    result.context.registerAnswerControl(answer);

    result.context.setAnswerSelectionFromInteraction(answer.id, true);
    result.context.setAnswerSelectionFromInteraction(answer.id, false);

    expect(result.context.status()).toBe("unanswered");

    cleanup();
  });

  it("单选模式下选中新答案会替换旧答案", () => {
    const { result, cleanup } = renderItem({ multiple: false });
    const a = makeAnswer("choice");
    const b = makeAnswer("choice");
    result.context.registerAnswerControl(a);
    result.context.registerAnswerControl(b);

    result.context.setAnswerSelectionFromInteraction(a.id, true);
    result.context.setAnswerSelectionFromInteraction(b.id, true);

    expect(result.context.selectedAnswerIds()).toEqual([b.id]);

    cleanup();
  });

  it("多选模式下选中多个答案会累加", () => {
    const { result, cleanup } = renderItem({ multiple: true });
    const a = makeAnswer("choice");
    const b = makeAnswer("choice");
    result.context.registerAnswerControl(a);
    result.context.registerAnswerControl(b);

    result.context.setAnswerSelectionFromInteraction(a.id, true);
    result.context.setAnswerSelectionFromInteraction(b.id, true);

    expect(result.context.selectedAnswerIds()).toEqual([a.id, b.id]);

    cleanup();
  });

  it("多选模式下重复选中同一答案不产生重复项", () => {
    const { result, cleanup } = renderItem({ multiple: true });
    const a = makeAnswer("choice");
    result.context.registerAnswerControl(a);

    result.context.setAnswerSelectionFromInteraction(a.id, true);
    result.context.setAnswerSelectionFromInteraction(a.id, true);

    expect(result.context.selectedAnswerIds()).toEqual([a.id]);

    cleanup();
  });

  it("选中的答案是禁用状态时不算已回答", () => {
    const { result, cleanup } = renderItem();
    const answer = makeAnswer("choice", { disabled: true });
    result.context.registerAnswerControl(answer);

    result.context.setAnswerSelectionFromInteraction(answer.id, true);

    expect(result.context.status()).toBe("unanswered");

    cleanup();
  });

  it("元素自身 disabled 时同样不算已回答", () => {
    const { result, cleanup } = renderItem();
    const answer = makeAnswer("choice");
    (answer.element as HTMLInputElement).disabled = true;
    result.context.registerAnswerControl(answer);

    result.context.setAnswerSelectionFromInteraction(answer.id, true);

    expect(result.context.status()).toBe("unanswered");

    cleanup();
  });
});

describe("useQuestionnaireItem - skip / reset", () => {
  it("skippable 时 skip 会清空选中并置为 skipped", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const answer = makeAnswer("choice");
    result.context.registerAnswerControl(answer);
    result.context.setAnswerSelectionFromInteraction(answer.id, true);
    result.registerElement(document.createElement("fieldset"));

    registeredItems[0].skip();

    expect(result.context.status()).toBe("skipped");
    expect(result.context.selectedAnswerIds()).toEqual([]);

    cleanup();
  });

  it("required 时 skip 不生效", () => {
    const { result, cleanup, registeredItems } = renderItem({ required: true });
    const answer = makeAnswer("choice");
    result.context.registerAnswerControl(answer);
    result.context.setAnswerSelectionFromInteraction(answer.id, true);
    result.registerElement(document.createElement("fieldset"));

    registeredItems[0].skip();

    expect(result.context.status()).toBe("answered");

    cleanup();
  });

  it("交互选中会清除 skipped 状态", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const answer = makeAnswer("choice");
    result.context.registerAnswerControl(answer);
    result.registerElement(document.createElement("fieldset"));
    registeredItems[0].skip();

    result.context.setAnswerSelectionFromInteraction(answer.id, true);

    expect(result.context.status()).toBe("answered");

    cleanup();
  });

  it("reset 恢复默认选中并递增 resetVersion", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const answer = makeAnswer("choice");
    result.context.registerAnswerControl(answer);
    result.context.setAnswerDefault(answer.id, true);
    result.registerElement(document.createElement("fieldset"));

    const version = result.context.resetVersion();
    registeredItems[0].reset();

    expect(result.context.selectedAnswerIds()).toEqual([answer.id]);
    expect(result.context.resetVersion()).toBe(version + 1);

    cleanup();
  });

  it("reset 会清除 skipped 与 touched", () => {
    const { result, cleanup, registeredItems } = renderItem({
      invalid: false,
      required: false,
    });
    result.registerElement(document.createElement("fieldset"));
    registeredItems[0].skip();

    registeredItems[0].reset();

    expect(result.context.status()).toBe("unanswered");

    cleanup();
  });

  it("单选模式 reset 只恢复第一个默认项", () => {
    const { result, cleanup, registeredItems } = renderItem({
      multiple: false,
    });
    const a = makeAnswer("choice");
    const b = makeAnswer("choice");
    result.context.registerAnswerControl(a);
    result.context.registerAnswerControl(b);
    result.context.setAnswerDefault(a.id, true);
    result.context.setAnswerDefault(b.id, true);
    result.registerElement(document.createElement("fieldset"));

    registeredItems[0].reset();

    expect(result.context.selectedAnswerIds()).toEqual([a.id]);

    cleanup();
  });

  it("多选模式 reset 恢复全部默认项", () => {
    const { result, cleanup, registeredItems } = renderItem({ multiple: true });
    const a = makeAnswer("choice");
    const b = makeAnswer("choice");
    result.context.registerAnswerControl(a);
    result.context.registerAnswerControl(b);
    result.context.setAnswerDefault(a.id, true);
    result.context.setAnswerDefault(b.id, true);
    result.registerElement(document.createElement("fieldset"));

    registeredItems[0].reset();

    expect(result.context.selectedAnswerIds()).toEqual([a.id, b.id]);

    cleanup();
  });

  it("registerAnswerSelection 在多选下累加初始选中", () => {
    const { result, cleanup } = renderItem({ multiple: true });
    const a = makeAnswer("choice");
    const b = makeAnswer("choice");
    result.context.registerAnswerControl(a);
    result.context.registerAnswerControl(b);

    result.context.registerAnswerSelection(a.id, true);
    result.context.registerAnswerSelection(b.id, true);

    expect(result.context.selectedAnswerIds()).toEqual([a.id, b.id]);

    cleanup();
  });

  it("registerAnswerSelection 在单选下只接受第一个", () => {
    const { result, cleanup } = renderItem({ multiple: false });
    const a = makeAnswer("choice");
    const b = makeAnswer("choice");
    result.context.registerAnswerControl(a);
    result.context.registerAnswerControl(b);

    result.context.registerAnswerSelection(a.id, true);
    result.context.registerAnswerSelection(b.id, true);

    expect(result.context.selectedAnswerIds()).toEqual([a.id]);

    cleanup();
  });

  it("注销注册会同时移除选中与默认项", () => {
    const { result, cleanup } = renderItem();
    const a = makeAnswer("choice");
    const unregister = result.context.registerAnswerSelection(a.id, true);

    unregister();

    expect(result.context.selectedAnswerIds()).toEqual([]);

    cleanup();
  });
});

describe("useQuestionnaireItem - invalid 判定", () => {
  it("初始未 touched 时不 invalid", () => {
    const { result, cleanup } = renderItem();

    expect(result.context.invalid()).toBe(false);

    cleanup();
  });

  it("外部 invalid 为 true 时立即 invalid", () => {
    const { result, cleanup } = renderItem({ invalid: true });

    expect(result.context.invalid()).toBe(true);

    cleanup();
  });

  it("整体 disabled 时不 invalid（即使外部要求）", () => {
    const { result, cleanup } = renderItem({
      invalid: true,
      disabled: true,
    });

    expect(result.context.invalid()).toBe(false);

    cleanup();
  });

  it("touched 且未作答时 invalid", () => {
    const { result, cleanup, registeredItems } = renderItem();
    result.registerElement(document.createElement("fieldset"));

    registeredItems[0].validate();

    expect(result.context.invalid()).toBe(true);

    cleanup();
  });

  it("touched 且已作答时不算 invalid", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const answer = makeAnswer("choice");
    result.context.registerAnswerControl(answer);
    result.context.setAnswerSelectionFromInteraction(answer.id, true);
    result.registerElement(document.createElement("fieldset"));

    registeredItems[0].validate();

    expect(result.context.invalid()).toBe(false);

    cleanup();
  });

  it("skippable 状态不算 invalid", () => {
    const { result, cleanup, registeredItems } = renderItem({
      required: false,
    });
    result.registerElement(document.createElement("fieldset"));

    // 先 validate 让它 touched，再 skip
    registeredItems[0].validate();
    registeredItems[0].skip();

    expect(result.context.invalid()).toBe(false);

    cleanup();
  });

  it("required 时 skipped 仍算 invalid", () => {
    const { result, cleanup, registeredItems } = renderItem({
      required: true,
    });
    result.registerElement(document.createElement("fieldset"));

    registeredItems[0].skip();
    registeredItems[0].validate();

    expect(result.context.invalid()).toBe(true);

    cleanup();
  });
});

describe("useQuestionnaireItem - validate", () => {
  it("未作答时 validate 返回 false", () => {
    const { result, cleanup, registeredItems } = renderItem();
    result.registerElement(document.createElement("fieldset"));

    expect(registeredItems[0].validate()).toBe(false);

    cleanup();
  });

  it("已作答时 validate 返回 true", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const answer = makeAnswer("choice");
    result.context.registerAnswerControl(answer);
    result.context.setAnswerSelectionFromInteraction(answer.id, true);
    result.registerElement(document.createElement("fieldset"));

    expect(registeredItems[0].validate()).toBe(true);

    cleanup();
  });

  it("disabled 时 validate 直接通过", () => {
    const { result, cleanup, registeredItems } = renderItem({
      disabled: true,
    });
    result.registerElement(document.createElement("fieldset"));

    expect(registeredItems[0].validate()).toBe(true);

    cleanup();
  });

  it("required=false 且 skipped 时通过", () => {
    const { result, cleanup, registeredItems } = renderItem();
    result.registerElement(document.createElement("fieldset"));
    registeredItems[0].skip();

    expect(registeredItems[0].validate()).toBe(true);

    cleanup();
  });

  it("原生校验关闭时不检查 validity", () => {
    const { result, cleanup, registeredItems, setNativeValidation } =
      renderItem();
    const answer = makeAnswer("input");
    answer.element.value = "abc";
    result.context.registerAnswerControl(answer);
    result.context.setAnswerSelectionFromInteraction(answer.id, true);
    result.registerElement(document.createElement("fieldset"));
    setNativeValidation(false);

    expect(registeredItems[0].validate()).toBe(true);

    cleanup();
  });

  it("原生校验开启且 validity 无效时返回 false 并聚焦该元素", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const answer = makeAnswer("input", { elementType: "email" });
    // `isAnswerFilled` 对 input 型答案要求"有 name 且有值"
    answer.element.setAttribute("name", "q1");
    // jsdom 下 type=email + 非法值 => validity.valid 为 false
    answer.element.value = "not-an-email";
    result.context.registerAnswerControl(answer);
    result.context.setAnswerSelectionFromInteraction(answer.id, true);
    result.registerElement(document.createElement("fieldset"));

    // 前提校验：确认 jsdom 认为该值非法，否则本用例无意义
    expect(answer.element.willValidate).toBe(true);
    expect(answer.element.validity.valid).toBe(false);

    expect(registeredItems[0].validate()).toBe(false);

    cleanup();
  });

  it("原生校验开启但 validity 有效时通过", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const answer = makeAnswer("input", { elementType: "email" });
    answer.element.setAttribute("name", "q1");
    answer.element.value = "user@example.com";
    result.context.registerAnswerControl(answer);
    result.context.setAnswerSelectionFromInteraction(answer.id, true);
    result.registerElement(document.createElement("fieldset"));

    expect(answer.element.validity.valid).toBe(true);
    expect(registeredItems[0].validate()).toBe(true);

    cleanup();
  });
});

describe("useQuestionnaireItem - 快捷键分配", () => {
  it("没有 shortcut mode 时不分配快捷键", () => {
    const { result, cleanup } = renderItem();
    const a = makeAnswer("choice");
    result.context.registerAnswerControl(a);

    expect(result.context.shortcutByChoiceValue()).toBeNull();
    expect(result.context.shortcutByAnswerId().size).toBe(0);

    cleanup();
  });

  it("letters 模式按答案注册顺序分配 A、B…", () => {
    const { result, cleanup, setShortcuts } = renderItem();
    const a = makeAnswer("choice");
    const b = makeAnswer("choice");
    result.context.registerAnswerControl(a);
    result.context.registerAnswerControl(b);

    setShortcuts("letters");

    const map = result.context.shortcutByAnswerId();
    expect(map.get(a.id)).toBe("A");
    expect(map.get(b.id)).toBe("B");

    cleanup();
  });

  it("numbers 模式分配 1、2…", () => {
    const { result, cleanup, setShortcuts } = renderItem();
    const a = makeAnswer("choice");
    result.context.registerAnswerControl(a);

    setShortcuts("numbers");

    expect(result.context.shortcutByAnswerId().get(a.id)).toBe("1");

    cleanup();
  });

  it("字母表用尽后不再分配", () => {
    const { result, cleanup, setShortcuts } = renderItem();
    const answers = Array.from({ length: 30 }, () => makeAnswer("choice"));
    for (const answer of answers) result.context.registerAnswerControl(answer);

    setShortcuts("letters");

    const map = result.context.shortcutByAnswerId();
    expect(map.size).toBe(26);
    // 第 27 个及之后没有快捷键
    expect(map.get(answers[26].id)).toBeUndefined();

    cleanup();
  });

  it("input 型答案不参与快捷键分配（只分配 choice）", () => {
    const { result, cleanup, setShortcuts } = renderItem();
    const choice = makeAnswer("choice");
    const input = makeAnswer("input");
    result.context.registerAnswerControl(input);
    result.context.registerAnswerControl(choice);

    setShortcuts("letters");

    const map = result.context.shortcutByAnswerId();
    expect(map.get(choice.id)).toBe("A");
    expect(map.get(input.id)).toBeUndefined();

    cleanup();
  });

  it("有 itemDefinitions.choices 时按选项值分配（跳过 disabled）", () => {
    const { result, cleanup, setShortcuts, setItemDefinitions } = renderItem();
    const a = makeAnswer("choice", { value: "a" });
    const c = makeAnswer("choice", { value: "c" });
    result.context.registerAnswerControl(a);
    result.context.registerAnswerControl(c);

    setShortcuts("letters");
    setItemDefinitions(
      new Map([
        [
          "q1",
          {
            name: "q1",
            choices: [
              { value: "a" },
              { value: "b", disabled: true },
              { value: "c" },
            ],
          },
        ],
      ]) as never,
    );

    const byValue = result.context.shortcutByChoiceValue();
    expect(byValue?.get("a")).toBe("A");
    // b 被禁用，因此跳过，c 拿 B
    expect(byValue?.get("c")).toBe("B");

    cleanup();
  });

  it("按选项值分配时 shortcutByAnswerId 为空（互斥）", () => {
    const { result, cleanup, setShortcuts, setItemDefinitions } = renderItem();
    const a = makeAnswer("choice", { value: "a" });
    result.context.registerAnswerControl(a);

    setShortcuts("letters");
    setItemDefinitions(
      new Map([["q1", { name: "q1", choices: [{ value: "a" }] }]]) as never,
    );

    expect(result.context.shortcutByChoiceValue()?.get("a")).toBe("A");
    expect(result.context.shortcutByAnswerId().size).toBe(0);

    cleanup();
  });

  it("getAnswerByShortcut 在按值分配时按 value 命中", () => {
    const {
      result,
      cleanup,
      registeredItems,
      setShortcuts,
      setItemDefinitions,
    } = renderItem();
    const a = makeAnswer("choice", { value: "a" });
    result.context.registerAnswerControl(a);
    result.registerElement(document.createElement("fieldset"));

    setShortcuts("letters");
    setItemDefinitions(
      new Map([["q1", { name: "q1", choices: [{ value: "a" }] }]]) as never,
    );

    expect(registeredItems[0].getAnswerByShortcut("A")).toEqual(a);

    cleanup();
  });

  it("getAnswerByShortcut 在按 id 分配时按 id 命中", () => {
    const { result, cleanup, registeredItems, setShortcuts } = renderItem();
    const a = makeAnswer("choice", { value: "a" });
    result.context.registerAnswerControl(a);
    result.registerElement(document.createElement("fieldset"));

    setShortcuts("letters");

    expect(registeredItems[0].getAnswerByShortcut("A")).toEqual(a);

    cleanup();
  });

  it("未分配的快捷键返回 null", () => {
    const { result, cleanup, registeredItems, setShortcuts } = renderItem();
    result.context.registerAnswerControl(makeAnswer("choice"));
    result.registerElement(document.createElement("fieldset"));

    setShortcuts("letters");

    expect(registeredItems[0].getAnswerByShortcut("Z")).toBeNull();

    cleanup();
  });
});

describe("useQuestionnaireItem - itemProps / 描述 / 快捷键提示", () => {
  it("active 时 hidden / inert 为 false，否则为 true", () => {
    const { result, cleanup, setActiveItemName } = renderItem();

    expect(result.itemProps().hidden).toBe(false);
    expect(result.itemProps().inert).toBe(false);

    setActiveItemName(null);
    expect(result.itemProps().hidden).toBe(true);
    expect(result.itemProps().inert).toBe(true);

    cleanup();
  });

  it("tabIndex 恒为 -1（由内部控件接管焦点）", () => {
    const { result, cleanup } = renderItem();

    expect(result.itemProps().tabIndex).toBe(-1);

    cleanup();
  });

  it("disabled 透传到 itemProps", () => {
    const { result, cleanup } = renderItem({ disabled: true });

    expect(result.itemProps().disabled).toBe(true);

    cleanup();
  });

  it("invalid 时 aria-invalid 为 true", () => {
    const { result, cleanup } = renderItem({ invalid: true });

    expect(result.itemProps()["aria-invalid"]).toBe(true);

    cleanup();
  });

  it("未 invalid 时 aria-invalid 为 undefined", () => {
    const { result, cleanup } = renderItem();

    expect(result.itemProps()["aria-invalid"]).toBeUndefined();

    cleanup();
  });

  it("describedBy 汇总 description id", () => {
    const { result, cleanup } = renderItem();
    result.context.registerDescription("d1");
    result.context.registerDescription("d2");

    expect(result.describedBy()).toBe("d1 d2");

    cleanup();
  });

  it("invalid 时 describedBy 追加 error id", () => {
    const { result, cleanup } = renderItem({ invalid: true });
    result.context.registerDescription("d1");
    result.context.registerError("e1");

    expect(result.describedBy()).toBe("d1 e1");

    cleanup();
  });

  it("未 invalid 时不追加 error id", () => {
    const { result, cleanup } = renderItem();
    result.context.registerError("e1");

    expect(result.describedBy()).toBeUndefined();

    cleanup();
  });

  it("describedBy 去重", () => {
    const { result, cleanup } = renderItem();
    result.context.registerDescription("same");
    result.context.registerDescription("same");

    expect(result.describedBy()).toBe("same");

    cleanup();
  });

  it("注销 description 后不再出现在 describedBy", () => {
    const { result, cleanup } = renderItem();
    const unregister = result.context.registerDescription("d1");

    unregister();

    expect(result.describedBy()).toBeUndefined();

    cleanup();
  });
});

describe("useQuestionnaireItem - keyshortcuts", () => {
  it("非 active 时 keyshortcuts 为 undefined", () => {
    const { result, cleanup, setActiveItemName } = renderItem();

    setActiveItemName("other");

    expect(result.keyshortcuts()).toBeUndefined();

    cleanup();
  });

  it("active 时 keyshortcuts 含 Meta+Enter", () => {
    const { result, cleanup } = renderItem();

    expect(result.keyshortcuts()).toContain("Meta+Enter");

    cleanup();
  });

  it("有答案时含上下方向键", () => {
    const { result, cleanup } = renderItem();
    result.context.registerAnswerControl(makeAnswer("choice"));

    expect(result.keyshortcuts()).toContain("ArrowUp");
    expect(result.keyshortcuts()).toContain("ArrowDown");

    cleanup();
  });

  it("无答案时不含上下方向键", () => {
    const { result, cleanup } = renderItem();

    expect(result.keyshortcuts()).not.toContain("ArrowUp");

    cleanup();
  });

  it("非首题时含 ArrowLeft", () => {
    const { result, cleanup, setState } = renderItem();

    setState({ first: false, last: false } as never);

    expect(result.keyshortcuts()).toContain("ArrowLeft");

    cleanup();
  });

  it("首题时不含 ArrowLeft", () => {
    const { result, cleanup, setState } = renderItem();

    setState({ first: true, last: false } as never);

    expect(result.keyshortcuts()).not.toContain("ArrowLeft");

    cleanup();
  });

  it("已回答且非末题时含 ArrowRight", () => {
    const { result, cleanup, setState } = renderItem();
    const answer = makeAnswer("choice");
    result.context.registerAnswerControl(answer);
    result.context.setAnswerSelectionFromInteraction(answer.id, true);

    setState({ first: false, last: false } as never);

    expect(result.keyshortcuts()).toContain("ArrowRight");

    cleanup();
  });

  it("未回答时不含 ArrowRight", () => {
    const { result, cleanup, setState } = renderItem();

    setState({ first: false, last: false } as never);

    expect(result.keyshortcuts()).not.toContain("ArrowRight");

    cleanup();
  });

  it("末题时不含 ArrowRight", () => {
    const { result, cleanup, setState } = renderItem();
    const answer = makeAnswer("choice");
    result.context.registerAnswerControl(answer);
    result.context.setAnswerSelectionFromInteraction(answer.id, true);

    setState({ first: false, last: true } as never);

    expect(result.keyshortcuts()).not.toContain("ArrowRight");

    cleanup();
  });
});

describe("useQuestionnaireItem - registerElement 与 focus", () => {
  afterEach(() => {
    // jsdom 的 document.body 在用例间会残留元素（本文件大量手动 append），
    // 而 focus 的兜底查询是全局的 `target.querySelector(...)`，
    // 残留的 input 会污染结果，因此每个用例后清理 DOM。
    document.body.innerHTML = "";
  });

  it("registerElement 把句柄注册到 root 并返回注销函数", () => {
    const { result, cleanup, registerItem, registeredItems } = renderItem();

    const unregister = result.registerElement(
      document.createElement("fieldset"),
    );
    expect(registerItem).toHaveBeenCalledTimes(1);
    expect(registeredItems).toHaveLength(1);

    unregister();
    expect(registeredItems).toHaveLength(0);

    cleanup();
  });

  it("句柄上的 name / disabled / required / status 反映当前状态", () => {
    const { result, cleanup, registeredItems } = renderItem({
      name: "q9",
      disabled: true,
      required: true,
    });
    result.registerElement(document.createElement("fieldset"));

    const handle = registeredItems[0];
    expect(handle.name).toBe("q9");
    expect(handle.disabled()).toBe(true);
    expect(handle.required()).toBe(true);
    expect(handle.status()).toBe("unanswered");

    cleanup();
  });

  it("focus 优先聚焦带 data-filled 且有 name 的 input", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const scope = document.createElement("fieldset");
    const filled = document.createElement("input");
    filled.setAttribute("data-filled", "");
    filled.setAttribute("name", "q1");
    const plain = document.createElement("input");
    scope.append(plain, filled);
    document.body.appendChild(scope);
    result.registerElement(scope);

    registeredItems[0].focus();

    expect(document.activeElement).toBe(filled);

    cleanup();
  });

  it("focus 在没有 data-filled 时退回到第一个可用 input", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const scope = document.createElement("fieldset");
    const first = document.createElement("input");
    scope.appendChild(first);
    document.body.appendChild(scope);
    result.registerElement(scope);

    registeredItems[0].focus();

    expect(document.activeElement).toBe(first);

    cleanup();
  });

  it("focus 没有可聚焦子元素时聚焦 fieldset 本身", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const scope = document.createElement("fieldset");
    // 真实组件由 itemProps().tabIndex = -1 让 fieldset 可编程聚焦；
    // 无 tabindex 时 focus() 会落到 body 上，这里对齐真实用法。
    scope.tabIndex = -1;
    document.body.appendChild(scope);
    result.registerElement(scope);

    registeredItems[0].focus();

    expect(document.activeElement).toBe(scope);

    cleanup();
  });

  it("未注册元素时 focus 不抛错", () => {
    const { result, cleanup, registeredItems } = renderItem();
    result.registerElement(document.createElement("fieldset"));

    expect(() => registeredItems[0].focus()).not.toThrow();

    cleanup();
  });

  it("focusInvalid 与 focus 行为一致", () => {
    const { result, cleanup, registeredItems } = renderItem();
    const scope = document.createElement("fieldset");
    const input = document.createElement("input");
    scope.appendChild(input);
    document.body.appendChild(scope);
    result.registerElement(scope);

    registeredItems[0].focusInvalid();

    expect(document.activeElement).toBe(input);

    cleanup();
  });
});

describe("useQuestionnaireItem - moveAnswerFocus", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  /** 建一个 scope + N 个已注册的 choice 答案（都挂在 scope 内，isConnected 为 true） */
  function setup(hook: ReturnType<typeof renderItem>, count = 3) {
    const scope = document.createElement("fieldset");
    document.body.appendChild(scope);
    const answers = Array.from({ length: count }, () => makeAnswer("choice"));
    for (const answer of answers) {
      scope.appendChild(answer.element);
      hook.result.context.registerAnswerControl(answer);
    }
    hook.result.registerElement(scope);
    return { scope, answers };
  }

  it("next 从第一个移到第二个", () => {
    const hook = renderItem();
    const { answers } = setup(hook);

    answers[0].element.focus();
    const moved = hook.registeredItems[0].moveAnswerFocus(
      answers[0].element,
      "next",
    );

    expect(moved).toBe(true);
    expect(document.activeElement).toBe(answers[1].element);

    hook.cleanup();
  });

  it("previous 从第二个移回第一个", () => {
    const hook = renderItem();
    const { answers } = setup(hook);

    answers[1].element.focus();
    hook.registeredItems[0].moveAnswerFocus(answers[1].element, "previous");

    expect(document.activeElement).toBe(answers[0].element);

    hook.cleanup();
  });

  it("next 在末尾环绕回第一个", () => {
    const hook = renderItem();
    const { answers } = setup(hook);

    answers[2].element.focus();
    hook.registeredItems[0].moveAnswerFocus(answers[2].element, "next");

    expect(document.activeElement).toBe(answers[0].element);

    hook.cleanup();
  });

  it("previous 在开头环绕到最后一个", () => {
    const hook = renderItem();
    const { answers } = setup(hook);

    answers[0].element.focus();
    hook.registeredItems[0].moveAnswerFocus(answers[0].element, "previous");

    expect(document.activeElement).toBe(answers[2].element);

    hook.cleanup();
  });

  it("没有可聚焦答案时返回 false", () => {
    const hook = renderItem();
    const scope = document.createElement("fieldset");
    document.body.appendChild(scope);
    hook.result.registerElement(scope);

    expect(
      hook.registeredItems[0].moveAnswerFocus(
        document.createElement("input"),
        "next",
      ),
    ).toBe(false);

    hook.cleanup();
  });

  it("目标不在答案列表且不是 scope 时返回 false", () => {
    const hook = renderItem();
    setup(hook);

    expect(
      hook.registeredItems[0].moveAnswerFocus(
        document.createElement("input"),
        "next",
      ),
    ).toBe(false);

    hook.cleanup();
  });

  it("只有一条答案时不移到自己（返回 false）", () => {
    const hook = renderItem();
    const { answers } = setup(hook, 1);

    answers[0].element.focus();
    const moved = hook.registeredItems[0].moveAnswerFocus(
      answers[0].element,
      "next",
    );

    expect(moved).toBe(false);

    hook.cleanup();
  });

  it("跳过 disabled 的答案", () => {
    const hook = renderItem();
    const { answers } = setup(hook);
    answers[1].element.disabled = true;

    answers[0].element.focus();
    hook.registeredItems[0].moveAnswerFocus(answers[0].element, "next");

    expect(document.activeElement).toBe(answers[2].element);

    hook.cleanup();
  });

  it("从 scope 出发时 next 聚焦第一个可用答案", () => {
    const hook = renderItem();
    const { scope, answers } = setup(hook);

    const moved = hook.registeredItems[0].moveAnswerFocus(scope, "next");

    expect(moved).toBe(true);
    expect(document.activeElement).toBe(answers[0].element);

    hook.cleanup();
  });

  it("从 scope 出发时 previous 聚焦最后一个可用答案", () => {
    const hook = renderItem();
    const { scope, answers } = setup(hook);

    hook.registeredItems[0].moveAnswerFocus(scope, "previous");

    expect(document.activeElement).toBe(answers[2].element);

    hook.cleanup();
  });

  it("脱离 DOM 的答案不参与导航", () => {
    const hook = renderItem();
    const { answers } = setup(hook);
    answers[1].element.remove();

    answers[0].element.focus();
    hook.registeredItems[0].moveAnswerFocus(answers[0].element, "next");

    expect(document.activeElement).toBe(answers[2].element);

    hook.cleanup();
  });
});
