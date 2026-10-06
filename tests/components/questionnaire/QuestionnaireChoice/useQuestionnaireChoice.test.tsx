import { renderHook } from "@solidjs/testing-library";
import { createSignal, type ParentProps } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import {
  QuestionnaireItemContext,
  type QuestionnaireItemContextValue,
} from "~/components/questionnaire/questionnaire.context";
import { useQuestionnaireChoice } from "~/components/questionnaire/QuestionnaireChoice/useQuestionnaireChoice";

/**
 * `useQuestionnaireChoice` 是"固定选项"的交互算法：单选/多选的 input type、
 * checked 解析（受控 vs 选中集合 vs skipped）、快捷键、required 推导。
 *
 * 与 `useQuestionnaireInput` 一样，这里构造受控的假 context 来隔离被测逻辑。
 */
function createFakeItemContext(
  overrides: Partial<QuestionnaireItemContextValue> = {},
) {
  const [disabled, setDisabled] = createSignal(false);
  const [invalid, setInvalid] = createSignal(false);
  const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
  const [resetVersion, setResetVersion] = createSignal(0);
  const [status, setStatus] = createSignal<"unanswered" | "skipped">(
    "unanswered",
  );
  const [multiple, setMultiple] = createSignal(false);
  const [required, setRequired] = createSignal(true);
  const [hasInputAnswer, setHasInputAnswer] = createSignal(false);

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
    multiple,
    required,
    status: () => status() as never,
    hasInputAnswer,
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
    setStatus,
    setMultiple,
    setRequired,
    setHasInputAnswer,
  };
}

function renderChoice(
  options: {
    value?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    onChange?: (event: Event) => void;
  } = {},
  ctxOverrides: Partial<QuestionnaireItemContextValue> = {},
) {
  const fake = createFakeItemContext(ctxOverrides);
  const [checked] = createSignal(options.checked);
  const [defaultChecked] = createSignal(options.defaultChecked ?? false);
  const [disabled] = createSignal(options.disabled ?? false);

  const rendered = renderHook(
    () =>
      useQuestionnaireChoice({
        value: options.value ?? "a",
        checked,
        // defaultChecked / disabled 的类型都是 Accessor<boolean>（不接受 undefined）
        defaultChecked: () => defaultChecked(),
        disabled: () => disabled(),
        onChange: options.onChange,
      }),
    { wrapper: fake.wrapper },
  );

  // 真实组件在 `<input ref>` 里调用 setInput
  const input = document.createElement("input");
  rendered.result.setInput(input);

  return { ...fake, ...rendered, input };
}

describe("useQuestionnaireChoice - input 类型", () => {
  it("单选时 type 为 radio", () => {
    const { result, cleanup } = renderChoice();

    expect(result.type()).toBe("radio");
    expect(result.inputProps().type).toBe("radio");

    cleanup();
  });

  it("多选时 type 为 checkbox", () => {
    const { result, cleanup, setMultiple } = renderChoice();

    setMultiple(true);

    expect(result.type()).toBe("checkbox");

    cleanup();
  });
});

describe("useQuestionnaireChoice - checked 解析", () => {
  it("非受控：由选中集合决定", () => {
    const { result, cleanup } = renderChoice();

    expect(result.checkedResolved()).toBe(false);

    cleanup();
  });

  it("非受控：id 在选中集合里时为 true", () => {
    const { result, cleanup, setSelectedIds } = renderChoice();

    setSelectedIds([result.id]);

    expect(result.checkedResolved()).toBe(true);

    cleanup();
  });

  it("受控：由 checked 决定（true）", () => {
    const { result, cleanup } = renderChoice({ checked: true });

    expect(result.checkedResolved()).toBe(true);

    cleanup();
  });

  it("受控：由 checked 决定（false）", () => {
    const { result, cleanup } = renderChoice({ checked: false });

    expect(result.checkedResolved()).toBe(false);

    cleanup();
  });

  it("受控 + skipped 时强制为 false", () => {
    const { result, cleanup, setStatus } = renderChoice({ checked: true });

    setStatus("skipped");

    expect(result.checkedResolved()).toBe(false);

    cleanup();
  });

  it("非受控 + skipped 时不受影响", () => {
    const { result, cleanup, setSelectedIds, setStatus } = renderChoice();
    setSelectedIds([result.id]);
    setStatus("skipped");

    // 非受控分支不看 status，只看选中集合
    expect(result.checkedResolved()).toBe(true);

    cleanup();
  });

  it("checked 写进 inputProps", () => {
    const { result, cleanup } = renderChoice({ checked: true });

    expect(result.inputProps().checked).toBe(true);

    cleanup();
  });
});

describe("useQuestionnaireChoice - 禁用与校验", () => {
  it("item 禁用时 isDisabled 为 true", () => {
    const { result, cleanup, setDisabled } = renderChoice();

    setDisabled(true);
    expect(result.isDisabled()).toBe(true);

    cleanup();
  });

  it("自身 disabled 时 isDisabled 为 true", () => {
    const { result, cleanup } = renderChoice({ disabled: true });

    expect(result.isDisabled()).toBe(true);

    cleanup();
  });

  it("单选 + required + 无输入答案时 required 为 true", () => {
    const { result, cleanup } = renderChoice();

    expect(result.required()).toBe(true);

    cleanup();
  });

  it("多选时 required 为 false", () => {
    const { result, cleanup, setMultiple } = renderChoice();

    setMultiple(true);

    expect(result.required()).toBe(false);

    cleanup();
  });

  it("存在输入型答案时 required 为 false", () => {
    const { result, cleanup, setHasInputAnswer } = renderChoice();

    setHasInputAnswer(true);

    expect(result.required()).toBe(false);

    cleanup();
  });

  it("invalid 写进 inputProps / invalid accessor", () => {
    const { result, cleanup, setInvalid } = renderChoice();

    expect(result.inputProps()["aria-invalid"]).toBeUndefined();
    setInvalid(true);
    expect(result.invalid()).toBe(true);
    expect(result.inputProps()["aria-invalid"]).toBe(true);

    cleanup();
  });
});

describe("useQuestionnaireChoice - name", () => {
  it("正常状态下使用 item 的 name", () => {
    const { result, cleanup } = renderChoice();

    expect(result.name()).toBe("q1");

    cleanup();
  });

  it("skipped 时 name 为 undefined（不参与提交）", () => {
    const { result, cleanup, setStatus } = renderChoice();

    setStatus("skipped");

    expect(result.name()).toBeUndefined();
    expect(result.inputProps().name).toBeUndefined();

    cleanup();
  });
});

describe("useQuestionnaireChoice - 注册与同步", () => {
  it("挂载时注册 initial defaultChecked", () => {
    const { calls, cleanup } = renderChoice({ defaultChecked: true });

    expect(calls.registerAnswerSelection).toHaveBeenCalledWith(
      expect.any(String),
      true,
    );

    cleanup();
  });

  it("未给 defaultChecked 时注册为 false", () => {
    const { calls, cleanup } = renderChoice();

    expect(calls.registerAnswerSelection).toHaveBeenCalledWith(
      expect.any(String),
      false,
    );

    cleanup();
  });

  it("挂载时同步 default 状态给 item", () => {
    const { calls, cleanup } = renderChoice({ defaultChecked: true });

    expect(calls.setAnswerDefault).toHaveBeenCalledWith(
      expect.any(String),
      true,
    );

    cleanup();
  });

  it("受控时同步受控选中状态", () => {
    const { calls, cleanup } = renderChoice({ checked: true });

    expect(calls.syncControlledAnswerSelection).toHaveBeenCalledWith(
      expect.any(String),
      true,
    );

    cleanup();
  });

  it("把 DOM checked 写成解析结果", () => {
    const { input, cleanup } = renderChoice({ checked: true });

    expect(input.checked).toBe(true);

    cleanup();
  });
});

describe("useQuestionnaireChoice - aria-keyshortcuts", () => {
  it("没有快捷键且未选中时不输出", () => {
    const { result, cleanup } = renderChoice();

    expect(result.ariaKeyShortcuts()).toBeUndefined();

    cleanup();
  });

  it("选中时至少输出 Enter", () => {
    const { result, cleanup, setSelectedIds } = renderChoice();
    setSelectedIds([result.id]);

    expect(result.ariaKeyShortcuts()).toBe("Enter");

    cleanup();
  });

  it("禁用时不输出 Enter", () => {
    const { result, cleanup, setSelectedIds } = renderChoice({
      disabled: true,
    });
    setSelectedIds([result.id]);

    expect(result.ariaKeyShortcuts()).toBeUndefined();

    cleanup();
  });

  it("有快捷键且选中时与 Enter 一起输出", () => {
    // 快捷键来自 item 的 shortcutByChoiceValue（按选项值查表）
    const { result, cleanup, setSelectedIds } = renderChoice(
      { value: "a" },
      { shortcutByChoiceValue: () => new Map([["a", "A"]]) },
    );
    setSelectedIds([result.id]);

    expect(result.ariaKeyShortcuts()).toBe("A Enter");

    cleanup();
  });

  it("有快捷键但未选中时只输出快捷键", () => {
    const { result, cleanup } = renderChoice(
      { value: "a" },
      { shortcutByChoiceValue: () => new Map([["a", "A"]]) },
    );

    expect(result.ariaKeyShortcuts()).toBe("A");

    cleanup();
  });
});

describe("useQuestionnaireChoice - 交互事件", () => {
  /** 造一个带 checked 的 change 事件（cancelable，preventDefault 才生效） */
  function changeEvent(checked: boolean): Event {
    const input = document.createElement("input");
    input.checked = checked;
    const event = new Event("change", { cancelable: true });
    Object.defineProperty(event, "target", { value: input });
    return event;
  }

  it("非受控：改变 checked 后同步给 item", () => {
    const { result, cleanup, calls } = renderChoice();

    result.handleChange(changeEvent(true));

    expect(calls.setAnswerSelectionFromInteraction).toHaveBeenCalledWith(
      expect.any(String),
      true,
    );

    cleanup();
  });

  it("非受控：取消选中同样同步", () => {
    const { result, cleanup, calls } = renderChoice();

    result.handleChange(changeEvent(false));

    expect(calls.setAnswerSelectionFromInteraction).toHaveBeenCalledWith(
      expect.any(String),
      false,
    );

    cleanup();
  });

  it("用户 onChange 被调用", () => {
    const onChange = vi.fn();
    const { result, cleanup } = renderChoice({ onChange });

    result.handleChange(changeEvent(true));

    expect(onChange).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("用户 onChange 里 preventDefault 后不再同步", () => {
    const onChange = vi.fn((event: Event) => event.preventDefault());
    const { result, cleanup, calls } = renderChoice({ onChange });

    result.handleChange(changeEvent(true));

    expect(onChange).toHaveBeenCalled();
    expect(calls.setAnswerSelectionFromInteraction).not.toHaveBeenCalled();

    cleanup();
  });

  it("受控（非 skipped）：不写内部选中状态", () => {
    const { result, cleanup, calls } = renderChoice({ checked: false });

    result.handleChange(changeEvent(true));

    expect(calls.setAnswerSelectionFromInteraction).not.toHaveBeenCalled();

    cleanup();
  });

  it("受控 + skipped 且 checked 与目标一致时恢复选中", () => {
    const { result, cleanup, calls, setStatus } = renderChoice({
      checked: true,
    });

    // checkedResolved 在 skipped 下为 false，因此 DOM 上的 target.checked
    // 会与受控值相反（target=true 表示用户想选中）
    setStatus("skipped");
    result.handleChange(changeEvent(true));

    expect(calls.setAnswerSelectionFromInteraction).toHaveBeenCalledWith(
      expect.any(String),
      true,
    );

    cleanup();
  });

  it("受控 + skipped 但 checked 与目标不一致时不恢复", () => {
    const { result, cleanup, calls, setStatus } = renderChoice({
      checked: false,
    });

    setStatus("skipped");
    // 用户想选中（true），但受控值是 false => 不一致
    result.handleChange(changeEvent(true));

    expect(calls.setAnswerSelectionFromInteraction).not.toHaveBeenCalled();

    cleanup();
  });
});
