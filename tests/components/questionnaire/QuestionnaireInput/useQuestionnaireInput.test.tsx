import { renderHook } from "@solidjs/testing-library";
import { createSignal, type ParentProps } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import {
  QuestionnaireItemContext,
  type QuestionnaireItemContextValue,
} from "~/components/questionnaire/questionnaire.context";
import { useQuestionnaireInput } from "~/components/questionnaire/QuestionnaireInput/useQuestionnaireInput";

/**
 * `useQuestionnaireInput` 是"自由作答输入"的交互算法：选中状态、填充状态、
 * 受控/非受控、FormData 参与与否、aria-keyshortcuts 全部由它决定。
 *
 * 它依赖 `QuestionnaireItemContext`，因此这里构造一个**受控的假 context**
 * （而不是渲染完整组件树）——既能精确驱动每个 accessor，也避免组件树里的
 * 间接行为掩盖被测逻辑（TESTING.md §4.5：不 mock 被测对象，但要提供可控依赖）。
 */
function createFakeItemContext(
  overrides: Partial<QuestionnaireItemContextValue> = {},
) {
  const [disabled, setDisabled] = createSignal(false);
  const [invalid, setInvalid] = createSignal(false);
  const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
  const [resetVersion, setResetVersion] = createSignal(0);

  const calls = {
    registerAnswerControl: vi.fn(() => () => {}),
    registerAnswerSelection: vi.fn(() => () => {}),
    setAnswerDefault: vi.fn(),
    setAnswerSelectionFromInteraction: vi.fn(),
    syncControlledAnswerSelection: vi.fn(),
  };

  const ctx: QuestionnaireItemContextValue = {
    name: "q1",
    active: () => true,
    disabled,
    invalid,
    multiple: () => false,
    required: () => true,
    status: () => "unanswered",
    hasInputAnswer: () => true,
    selectedAnswerIds: selectedIds,
    resetVersion,
    shortcutByAnswerId: () => new Map(),
    shortcutByChoiceValue: () => null,
    shortcuts: () => null,
    registerAnswerControl: calls.registerAnswerControl,
    registerAnswerSelection: calls.registerAnswerSelection,
    registerDescription: () => () => {},
    registerError: () => () => {},
    setAnswerDefault: calls.setAnswerDefault,
    setAnswerSelectionFromInteraction: calls.setAnswerSelectionFromInteraction,
    syncControlledAnswerSelection: calls.syncControlledAnswerSelection,
    ...overrides,
  };

  const wrapper = (props: ParentProps) => (
    <QuestionnaireItemContext.Provider value={ctx}>
      {props.children}
    </QuestionnaireItemContext.Provider>
  );

  return {
    ctx,
    calls,
    wrapper,
    setDisabled,
    setInvalid,
    setSelectedIds,
    setResetVersion,
  };
}

function renderInput(
  options: {
    type?: string;
    defaultValue?: string;
    value?: string;
    disabled?: boolean;
    onChange?: (event: Event) => void;
  },
  ctxOverrides: Partial<QuestionnaireItemContextValue> = {},
) {
  const fake = createFakeItemContext(ctxOverrides);
  const [type] = createSignal(options.type ?? "text");
  const [defaultValue] = createSignal(options.defaultValue);
  const [value] = createSignal(options.value);
  const [disabled] = createSignal(options.disabled);

  const rendered = renderHook(
    () =>
      useQuestionnaireInput({
        type,
        defaultValue,
        value,
        disabled,
        onChange: options.onChange,
      }),
    { wrapper: fake.wrapper },
  );

  // 真实组件在 `<input ref>` 里调用 setInput；renderHook 不会渲染 DOM，
  // 因此这里补上一个真实的 input 元素，让依赖 input() 的 effect 能跑起来。
  const input = document.createElement("input");
  rendered.result.setInput(input);

  return { ...fake, ...rendered, input };
}

describe("useQuestionnaireInput - 选中与命名", () => {
  it('未被选中时不参与 FormData（form=""、无 name）', () => {
    const { result, cleanup } = renderInput({ defaultValue: "abc" });

    expect(result.name()).toBeUndefined();
    expect(result.formValue()).toBe("");
    expect(result.inputProps().form).toBe("");
    expect(result.inputProps().name).toBeUndefined();

    cleanup();
  });

  it("被选中时参与 FormData（有 name、无 form 排除）", () => {
    const { result, cleanup, setSelectedIds } = renderInput({
      defaultValue: "abc",
    });

    setSelectedIds([result.id]);

    expect(result.name()).toBe("q1");
    expect(result.formValue()).toBeUndefined();
    expect(result.inputProps().form).toBeUndefined();
    expect(result.inputProps().name).toBe("q1");

    cleanup();
  });

  it("id 会写进 inputProps", () => {
    const { result, cleanup } = renderInput({});

    expect(result.inputProps().id).toBe(result.id);

    cleanup();
  });
});

describe("useQuestionnaireInput - 填充状态", () => {
  it("非受控：默认值为空时 filled 为 false", () => {
    const { result, cleanup } = renderInput({});

    expect(result.filled()).toBe(false);

    cleanup();
  });

  it("非受控：默认值非空时 filled 为 true", () => {
    const { result, cleanup } = renderInput({ defaultValue: "abc" });

    expect(result.filled()).toBe(true);

    cleanup();
  });

  it("受控：由 props.value 决定 filled", () => {
    const { result, cleanup } = renderInput({ value: "abc" });

    expect(result.controlled()).toBe(true);
    expect(result.filled()).toBe(true);

    cleanup();
  });

  it("受控：value 为空字符串时 filled 为 false", () => {
    const { result, cleanup } = renderInput({ value: "" });

    expect(result.filled()).toBe(false);

    cleanup();
  });

  it("受控：value 只有空白时 filled 为 false", () => {
    const { result, cleanup } = renderInput({ value: "   " });

    expect(result.filled()).toBe(false);

    cleanup();
  });

  it("非受控：默认值只有空白时 filled 为 false", () => {
    const { result, cleanup } = renderInput({ defaultValue: "  " });

    expect(result.filled()).toBe(false);

    cleanup();
  });
});

describe("useQuestionnaireInput - 禁用状态", () => {
  it("item 禁用时 isDisabled 为 true", () => {
    const { result, cleanup, setDisabled } = renderInput({});

    setDisabled(true);
    expect(result.isDisabled()).toBe(true);

    cleanup();
  });

  it("自身 disabled 时 isDisabled 为 true", () => {
    const { result, cleanup } = renderInput({ disabled: true });

    expect(result.isDisabled()).toBe(true);

    cleanup();
  });

  it("默认不禁用", () => {
    const { result, cleanup } = renderInput({});

    expect(result.isDisabled()).toBe(false);

    cleanup();
  });

  it("disabled 写进 inputProps", () => {
    const { result, cleanup } = renderInput({ disabled: true });

    expect(result.inputProps().disabled).toBe(true);

    cleanup();
  });
});

describe("useQuestionnaireInput - 注册与同步", () => {
  it("挂载时注册初始选中状态", () => {
    const { calls, cleanup } = renderInput({ defaultValue: "abc" });

    expect(calls.registerAnswerSelection).toHaveBeenCalledWith(
      expect.any(String),
      true,
    );

    cleanup();
  });

  it("挂载时把初始填充状态同步给 item", () => {
    const { calls, cleanup } = renderInput({ defaultValue: "abc" });

    expect(calls.setAnswerDefault).toHaveBeenCalledWith(
      expect.any(String),
      true,
    );

    cleanup();
  });

  it("默认值为空时初始填充为 false", () => {
    const { calls, cleanup } = renderInput({});

    expect(calls.setAnswerDefault).toHaveBeenCalledWith(
      expect.any(String),
      false,
    );

    cleanup();
  });

  it("受控模式下同步受控选中状态", () => {
    const { calls, cleanup } = renderInput({ value: "abc" });

    expect(calls.syncControlledAnswerSelection).toHaveBeenCalledWith(
      expect.any(String),
      true,
    );

    cleanup();
  });
});

describe("useQuestionnaireInput - aria-keyshortcuts", () => {
  it("选中且有值时附上 Enter", () => {
    const { result, cleanup, setSelectedIds } = renderInput({
      defaultValue: "abc",
    });
    setSelectedIds([result.id]);

    expect(result.ariaKeyShortcuts()).toBe("Enter");

    cleanup();
  });

  it("未选中时不附 Enter", () => {
    const { result, cleanup } = renderInput({ defaultValue: "abc" });

    expect(result.ariaKeyShortcuts()).toBeUndefined();

    cleanup();
  });

  it("选中但无值时不附 Enter", () => {
    const { result, cleanup, setSelectedIds } = renderInput({});
    setSelectedIds([result.id]);

    expect(result.ariaKeyShortcuts()).toBeUndefined();

    cleanup();
  });

  it("禁用时不附 Enter", () => {
    const { result, cleanup, setSelectedIds } = renderInput({
      defaultValue: "abc",
      disabled: true,
    });
    setSelectedIds([result.id]);

    expect(result.ariaKeyShortcuts()).toBeUndefined();

    cleanup();
  });

  it("invalid 时 aria-invalid 为 true", () => {
    const { result, cleanup, setInvalid } = renderInput({});

    expect(result.inputProps()["aria-invalid"]).toBeUndefined();
    setInvalid(true);
    expect(result.inputProps()["aria-invalid"]).toBe(true);

    cleanup();
  });
});

describe("useQuestionnaireInput - 输入事件", () => {
  /** 造一个带 value 的 change 事件（cancelable，preventDefault 才生效） */
  function changeEvent(value: string): Event {
    const input = document.createElement("input");
    input.value = value;
    // 注意：`new Event("change")` 默认 cancelable=false，
    // 此时 preventDefault() 不会把 defaultPrevented 置为 true。
    const event = new Event("change", { cancelable: true });
    Object.defineProperty(event, "target", { value: input });
    return event;
  }

  it("非受控：输入后 filled 跟随变化并同步给 item", () => {
    const { result, cleanup, calls } = renderInput({});

    result.inputProps().onChange(changeEvent("hello"));

    expect(result.filled()).toBe(true);
    expect(calls.setAnswerSelectionFromInteraction).toHaveBeenCalledWith(
      expect.any(String),
      true,
    );

    cleanup();
  });

  it("非受控：清空后 filled 变回 false", () => {
    const { result, cleanup } = renderInput({ defaultValue: "abc" });

    result.inputProps().onChange(changeEvent(""));

    expect(result.filled()).toBe(false);

    cleanup();
  });

  it("用户 onChange 被调用", () => {
    const onChange = vi.fn();
    const { result, cleanup } = renderInput({ onChange });

    result.inputProps().onChange(changeEvent("x"));

    expect(onChange).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("用户 onChange 里 preventDefault 后不再更新内部状态", () => {
    const onChange = vi.fn((event: Event) => event.preventDefault());
    const { result, cleanup, calls } = renderInput({ onChange });

    result.inputProps().onChange(changeEvent("hello"));

    expect(onChange).toHaveBeenCalled();
    expect(result.filled()).toBe(false);
    expect(calls.setAnswerSelectionFromInteraction).not.toHaveBeenCalled();

    cleanup();
  });

  it("受控：输入不改变 filled（由外部值决定）", () => {
    const { result, cleanup } = renderInput({ value: "" });

    result.inputProps().onChange(changeEvent("hello"));

    expect(result.filled()).toBe(false);

    cleanup();
  });
});
