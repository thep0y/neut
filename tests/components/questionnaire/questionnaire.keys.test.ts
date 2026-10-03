import { describe, expect, it, vi } from "vitest";
import type {
  QuestionnaireAnswerEntry,
  QuestionnaireItemHandle,
} from "~/components/questionnaire/questionnaire.context";
import { handleQuestionnaireKeyDown } from "~/components/questionnaire/questionnaire.keys";
import type { QuestionnaireItemStatus } from "~/components/questionnaire/questionnaire.types";

function key(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
}

/** 让事件带上真实的 target（jsdom 里 dispatch 才有 target，这里直接构造） */
function keyOnTarget(
  target: Element,
  keyName: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = key(keyName, init);
  Object.defineProperty(event, "target", { value: target, configurable: true });
  return event;
}

function answer(
  element: HTMLElement,
  extra: Partial<QuestionnaireAnswerEntry> = {},
): QuestionnaireAnswerEntry {
  return {
    id: extra.id ?? "answer",
    element: element as QuestionnaireAnswerEntry["element"],
    type: "choice",
    disabled: false,
    ...extra,
  };
}

function setup(
  overrides: {
    status?: QuestionnaireItemStatus;
    shortcuts?: "letters" | "numbers" | null;
    moveAnswerFocus?: (
      target: Element,
      direction: "next" | "previous",
    ) => boolean;
    byElement?: (element: Element) => QuestionnaireAnswerEntry | null;
    byShortcut?: (shortcut: string) => QuestionnaireAnswerEntry | null;
  } = {},
) {
  const goNext = vi.fn();
  const goPrevious = vi.fn();
  const submitOrNext = vi.fn();
  const item = {
    name: "q1",
    element: document.createElement("fieldset"),
    disabled: () => false,
    required: () => false,
    status: () => overrides.status ?? "answered",
    validate: () => true,
    focus: vi.fn(),
    focusInvalid: vi.fn(),
    skip: vi.fn(),
    reset: vi.fn(),
    getAnswerByElement: overrides.byElement ?? (() => null),
    getAnswerByShortcut: overrides.byShortcut ?? (() => null),
    moveAnswerFocus: overrides.moveAnswerFocus ?? (() => false),
  } as unknown as QuestionnaireItemHandle;

  const ctx = {
    item,
    status: () => item.status(),
    shortcuts: overrides.shortcuts === undefined ? null : overrides.shortcuts,
    goNext,
    goPrevious,
    submitOrNext,
  };

  return { ctx, goNext, goPrevious, submitOrNext, item };
}

const input = () => {
  const el = document.createElement("input");
  document.body.appendChild(el);
  return el;
};

const textField = () => {
  const el = document.createElement("textarea");
  document.body.appendChild(el);
  return el;
};

/** 中性目标：既不是输入类控件也不是原生 radio（方向键切题/快捷键都要求它） */
const neutralTarget = () => {
  const el = document.createElement("button");
  document.body.appendChild(el);
  return el;
};

describe("handleQuestionnaireKeyDown 前置放行", () => {
  it("已被处理的事件直接放行", () => {
    const { ctx, submitOrNext } = setup();
    const event = keyOnTarget(input(), "Enter", { metaKey: true });
    event.preventDefault();

    handleQuestionnaireKeyDown(event, ctx);

    expect(submitOrNext).not.toHaveBeenCalled();
  });

  it("输入法组合中放行", () => {
    const { ctx, submitOrNext } = setup();

    handleQuestionnaireKeyDown(
      keyOnTarget(input(), "Enter", { metaKey: true, isComposing: true }),
      ctx,
    );

    expect(submitOrNext).not.toHaveBeenCalled();
  });

  it("keyCode 229（输入法）放行", () => {
    const { ctx, submitOrNext } = setup();
    const event = keyOnTarget(input(), "Enter", { metaKey: true });
    Object.defineProperty(event, "keyCode", { value: 229 });

    handleQuestionnaireKeyDown(event, ctx);

    expect(submitOrNext).not.toHaveBeenCalled();
  });

  it("事件目标不是元素时放行", () => {
    const { ctx, submitOrNext } = setup();
    const event = key("Enter", { metaKey: true });
    Object.defineProperty(event, "target", { value: null, configurable: true });

    handleQuestionnaireKeyDown(event, ctx);

    expect(submitOrNext).not.toHaveBeenCalled();
  });
});

describe("handleQuestionnaireKeyDown 提交与切题", () => {
  it("Mod+Enter 提交或前进", () => {
    const { ctx, submitOrNext } = setup();

    const event = keyOnTarget(input(), "Enter", { metaKey: true });
    handleQuestionnaireKeyDown(event, ctx);

    expect(submitOrNext).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("Mod+Enter 长按不重复触发", () => {
    const { ctx, submitOrNext } = setup();

    handleQuestionnaireKeyDown(
      keyOnTarget(input(), "Enter", { metaKey: true, repeat: true }),
      ctx,
    );

    expect(submitOrNext).not.toHaveBeenCalled();
  });

  it("Ctrl+Shift+Enter 组合不触发（交给浏览器）", () => {
    const { ctx, submitOrNext } = setup();

    handleQuestionnaireKeyDown(
      keyOnTarget(input(), "Enter", { ctrlKey: true, shiftKey: true }),
      ctx,
    );

    expect(submitOrNext).not.toHaveBeenCalled();
  });

  it("ArrowLeft 切上一题、ArrowRight 切下一题", () => {
    const { ctx, goNext, goPrevious } = setup();

    handleQuestionnaireKeyDown(keyOnTarget(neutralTarget(), "ArrowLeft"), ctx);
    expect(goPrevious).toHaveBeenCalledTimes(1);

    handleQuestionnaireKeyDown(keyOnTarget(neutralTarget(), "ArrowRight"), ctx);
    expect(goNext).toHaveBeenCalledTimes(1);
  });

  it("未作答时 ArrowRight 不前进", () => {
    const { ctx, goNext } = setup({ status: "unanswered" });

    handleQuestionnaireKeyDown(keyOnTarget(neutralTarget(), "ArrowRight"), ctx);

    expect(goNext).not.toHaveBeenCalled();
  });

  it("长按左右箭头只切一次（repeat 时不切）", () => {
    const { ctx, goNext, goPrevious } = setup();

    const left = keyOnTarget(neutralTarget(), "ArrowLeft", { repeat: true });
    handleQuestionnaireKeyDown(left, ctx);
    const right = keyOnTarget(neutralTarget(), "ArrowRight", { repeat: true });
    handleQuestionnaireKeyDown(right, ctx);

    expect(goPrevious).not.toHaveBeenCalled();
    expect(goNext).not.toHaveBeenCalled();
    // 但仍会阻止默认行为，避免光标移动
    expect(left.defaultPrevented).toBe(true);
  });

  it("文本框里的左右箭头不切题", () => {
    const { ctx, goNext, goPrevious } = setup({ shortcuts: null });

    handleQuestionnaireKeyDown(keyOnTarget(textField(), "ArrowLeft"), ctx);
    handleQuestionnaireKeyDown(keyOnTarget(textField(), "ArrowRight"), ctx);

    expect(goPrevious).not.toHaveBeenCalled();
    expect(goNext).not.toHaveBeenCalled();
  });

  it("原生 radio 上的左右箭头不切题", () => {
    const radio = document.createElement("input");
    radio.type = "radio";
    document.body.appendChild(radio);
    const { ctx, goNext } = setup();

    handleQuestionnaireKeyDown(keyOnTarget(radio, "ArrowRight"), ctx);

    expect(goNext).not.toHaveBeenCalled();
  });
});

describe("handleQuestionnaireKeyDown 答案间移动", () => {
  it("上下箭头在 moveAnswerFocus 命中时阻止默认行为", () => {
    const moveAnswerFocus = vi.fn(() => true);
    const { ctx, goNext } = setup({ moveAnswerFocus });

    const event = keyOnTarget(input(), "ArrowDown");
    handleQuestionnaireKeyDown(event, ctx);

    expect(moveAnswerFocus).toHaveBeenCalledWith(expect.any(Element), "next");
    expect(event.defaultPrevented).toBe(true);
    expect(goNext).not.toHaveBeenCalled();
  });

  it("moveAnswerFocus 未命中时继续走后续分支", () => {
    const moveAnswerFocus = vi.fn(() => false);
    const { ctx } = setup({ moveAnswerFocus, shortcuts: null });

    const event = keyOnTarget(input(), "ArrowUp");
    handleQuestionnaireKeyDown(event, ctx);

    expect(event.defaultPrevented).toBe(false);
  });
});

describe("handleQuestionnaireKeyDown Enter 与快捷键", () => {
  it("在已填写的答案上按 Enter 提交或前进", () => {
    const element = input();
    element.checked = true;
    const { ctx, submitOrNext } = setup({
      byElement: (target) => (target === element ? answer(element) : null),
    });

    const event = keyOnTarget(element, "Enter");
    handleQuestionnaireKeyDown(event, ctx);

    expect(submitOrNext).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("答案未填写时按 Enter 只阻止默认行为、不前进", () => {
    const element = input();
    const { ctx, submitOrNext } = setup({
      byElement: () => answer(element),
    });

    const event = keyOnTarget(element, "Enter");
    handleQuestionnaireKeyDown(event, ctx);

    expect(submitOrNext).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it("目标不是已注册答案时 Enter 放行", () => {
    const { ctx, submitOrNext } = setup({ byElement: () => null });

    const event = keyOnTarget(input(), "Enter");
    handleQuestionnaireKeyDown(event, ctx);

    expect(submitOrNext).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("快捷键模式下按字母键会聚焦并点击对应选项", () => {
    const element = input();
    const clickSpy = vi.spyOn(element, "click");
    const { ctx } = setup({
      shortcuts: "letters",
      byShortcut: (shortcut) =>
        shortcut === "A" ? answer(element, { id: "a" }) : null,
    });

    const event = keyOnTarget(neutralTarget(), "a");
    handleQuestionnaireKeyDown(event, ctx);

    expect(document.activeElement).toBe(element);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("快捷键命中输入类答案时只聚焦、不点击", () => {
    const element = input();
    const clickSpy = vi.spyOn(element, "click");
    const { ctx } = setup({
      shortcuts: "letters",
      byShortcut: () => answer(element, { type: "input" }),
    });

    handleQuestionnaireKeyDown(keyOnTarget(neutralTarget(), "A"), ctx);

    expect(document.activeElement).toBe(element);
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("未开启快捷键时不匹配", () => {
    const { ctx } = setup({ shortcuts: null });

    const event = keyOnTarget(neutralTarget(), "a");
    handleQuestionnaireKeyDown(event, ctx);

    expect(event.defaultPrevented).toBe(false);
  });

  it("文本框里不触发快捷键", () => {
    const { ctx } = setup({ shortcuts: "letters" });

    const event = keyOnTarget(textField(), "a");
    handleQuestionnaireKeyDown(event, ctx);

    expect(event.defaultPrevented).toBe(false);
  });

  it("按键不在字母表内时不匹配", () => {
    const { ctx } = setup({
      shortcuts: "letters",
      byShortcut: () => answer(input()),
    });

    const event = keyOnTarget(neutralTarget(), "1");
    handleQuestionnaireKeyDown(event, ctx);

    expect(event.defaultPrevented).toBe(false);
  });

  it("没有对应答案时不匹配", () => {
    const { ctx } = setup({ shortcuts: "letters", byShortcut: () => null });

    const event = keyOnTarget(neutralTarget(), "a");
    handleQuestionnaireKeyDown(event, ctx);

    expect(event.defaultPrevented).toBe(false);
  });

  it("快捷键长按时阻止默认行为但不重复点击", () => {
    const element = input();
    const clickSpy = vi.spyOn(element, "click");
    const { ctx } = setup({
      shortcuts: "letters",
      byShortcut: () => answer(element),
    });

    const event = keyOnTarget(neutralTarget(), "a", { repeat: true });
    handleQuestionnaireKeyDown(event, ctx);

    expect(event.defaultPrevented).toBe(true);
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
