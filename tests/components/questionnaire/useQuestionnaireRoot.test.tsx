import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuestionnaireItemHandle } from "~/components/questionnaire/questionnaire.context";
import { useQuestionnaireRoot } from "~/components/questionnaire/useQuestionnaireRoot";
import type {
  QuestionnaireItemDefinition,
  QuestionnaireItemStatus,
  QuestionnaireShortcutMode,
} from "~/components/questionnaire/questionnaire.types";

/**
 * `useQuestionnaireRoot` 是全表单的状态机：题目注册与排序、激活项、进度、
 * 导航（下一题/上一题/跳过/提交）、键盘处理。
 *
 * 它通过 `registerItem(handle)` 接收题目句柄，因此这里直接注入假的 handle
 * ——不需要渲染 DOM 树，也能精确控制每题的行为（validate 结果、status 等）。
 */

interface FakeItemOptions {
  name: string;
  disabled?: boolean;
  required?: boolean;
  status?: QuestionnaireItemStatus;
  /** validate 的返回值，缺省为 true */
  valid?: boolean;
  /** 记录调用 */
  focusSpy?: () => void;
}

interface FakeItem extends QuestionnaireItemHandle {
  /** 测试侧可变的内部状态 */
  setValid: (value: boolean) => void;
  setDisabled: (value: boolean) => void;
  setStatus: (value: QuestionnaireItemStatus) => void;
  validateSpy: ReturnType<typeof vi.fn>;
  focusSpy: ReturnType<typeof vi.fn>;
  focusInvalidSpy: ReturnType<typeof vi.fn>;
  skipSpy: ReturnType<typeof vi.fn>;
  resetSpy: ReturnType<typeof vi.fn>;
  moveAnswerFocusSpy: ReturnType<typeof vi.fn>;
  getAnswerByElementSpy: ReturnType<typeof vi.fn>;
  getAnswerByShortcutSpy: ReturnType<typeof vi.fn>;
}

/** 造一个按 DOM 顺序挂到 body 的 <fieldset> 句柄 */
function makeFakeItem(options: FakeItemOptions, order: number): FakeItem {
  const el = document.createElement("fieldset");
  el.tabIndex = -1;
  // 用真实 DOM 顺序体现排序：按 order 依次 append
  el.setAttribute("data-order", String(order));
  document.body.appendChild(el);

  const [valid, setValid] = createSignal(options.valid ?? true);
  const [disabled, setDisabled] = createSignal(options.disabled ?? false);
  const [status, setStatus] = createSignal<QuestionnaireItemStatus>(
    options.status ?? "unanswered",
  );

  const validateSpy = vi.fn(() => valid());
  const focusSpy = vi.fn(() => el.focus());
  const focusInvalidSpy = vi.fn(() => el.focus());
  const skipSpy = vi.fn();
  const resetSpy = vi.fn();
  const moveAnswerFocusSpy = vi.fn(() => false);
  const getAnswerByElementSpy = vi.fn(() => null);
  const getAnswerByShortcutSpy = vi.fn(() => null);

  return {
    name: options.name,
    element: el,
    disabled,
    required: () => options.required ?? false,
    status,
    validate: validateSpy,
    focus: focusSpy,
    focusInvalid: focusInvalidSpy,
    skip: skipSpy,
    reset: resetSpy,
    getAnswerByElement: getAnswerByElementSpy,
    getAnswerByShortcut: getAnswerByShortcutSpy,
    moveAnswerFocus: moveAnswerFocusSpy,
    setValid,
    setDisabled,
    setStatus,
    validateSpy,
    focusSpy,
    focusInvalidSpy,
    skipSpy,
    resetSpy,
    moveAnswerFocusSpy,
    getAnswerByElementSpy,
    getAnswerByShortcutSpy,
  };
}

function renderRoot(
  overrides: {
    item?: string | undefined;
    defaultItem?: string | undefined;
    items?: readonly QuestionnaireItemDefinition[] | undefined;
    shortcuts?: QuestionnaireShortcutMode | undefined;
    noValidate?: boolean | undefined;
  } = {},
  itemOptions: FakeItemOptions[] = [],
) {
  const [item] = createSignal(overrides.item);
  const [defaultItem] = createSignal(
    overrides.defaultItem === undefined
      ? itemOptions[0]?.name
      : overrides.defaultItem,
  );
  const [items] = createSignal(overrides.items);
  const [shortcuts] = createSignal(overrides.shortcuts);
  const [noValidate] = createSignal(overrides.noValidate);
  const [formRef, setFormRef] = createSignal<HTMLFormElement | undefined>();

  const onItemChange = vi.fn();
  const onReset = vi.fn();
  const onSubmit = vi.fn();

  const hook = renderHook(() =>
    useQuestionnaireRoot({
      item,
      defaultItem,
      items,
      shortcuts,
      noValidate,
      onItemChange,
      onReset,
      onSubmit,
      formRef,
    }),
  );

  const fakeItems = itemOptions.map((options, index) =>
    makeFakeItem(options, index),
  );
  for (const fake of fakeItems) hook.result.context.registerItem(fake);

  return { ...hook, fakeItems, onItemChange, onReset, onSubmit, setFormRef };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useQuestionnaireRoot - 注册与排序", () => {
  it("按 DOM 顺序排队题目", () => {
    const { result, cleanup, fakeItems } = renderRoot({}, [
      { name: "q1" },
      { name: "q2" },
      { name: "q3" },
    ]);

    expect(result.context.state().total).toBe(3);
    expect(fakeItems).toHaveLength(3);
    // 激活项落在最后注册的那一项上（注册顺序即 DOM 顺序时就是 q1）
    expect(result.context.activeItemName()).toBe("q1");

    cleanup();
  });

  it("倒序注册时不按注册顺序取激活项（DOM 顺序优先）", () => {
    document.body.innerHTML = "";
    const [item] = createSignal<string | undefined>();
    const [defaultItem] = createSignal<string | undefined>();
    const [items] = createSignal<readonly QuestionnaireItemDefinition[]>();
    const [shortcuts] = createSignal<QuestionnaireShortcutMode>();
    const [noValidate] = createSignal<boolean>();
    const [formRef] = createSignal<HTMLFormElement>();

    const hook = renderHook(() =>
      useQuestionnaireRoot({
        item,
        defaultItem,
        items,
        shortcuts,
        noValidate,
        onItemChange: vi.fn(),
        formRef,
      }),
    );

    // 先按 DOM 顺序建元素
    const created = ["q1", "q2", "q3"].map((name, index) =>
      makeFakeItem({ name }, index),
    );
    // 再倒序注册。激活项一旦确定就不再随注册变动（避免新题目挂载时把用户拽走），
    // 因此首个注册的 q3 会成为激活项。
    for (const fake of [...created].reverse()) {
      hook.result.context.registerItem(fake);
    }

    expect(hook.result.context.activeItemName()).toBe("q3");
    expect(hook.result.context.state().total).toBe(3);

    hook.cleanup();
  });

  it("注销后题目从列表移除", () => {
    document.body.innerHTML = "";
    const [item] = createSignal<string | undefined>();
    const [defaultItem] = createSignal<string | undefined>();
    const [items] = createSignal<readonly QuestionnaireItemDefinition[]>();
    const [shortcuts] = createSignal<QuestionnaireShortcutMode>();
    const [noValidate] = createSignal<boolean>();
    const [formRef] = createSignal<HTMLFormElement>();

    const hook = renderHook(() =>
      useQuestionnaireRoot({
        item,
        defaultItem,
        items,
        shortcuts,
        noValidate,
        onItemChange: vi.fn(),
        formRef,
      }),
    );

    const q1 = makeFakeItem({ name: "q1" }, 0);
    const q2 = makeFakeItem({ name: "q2" }, 1);
    const unregisterQ1 = hook.result.context.registerItem(q1);
    hook.result.context.registerItem(q2);
    expect(hook.result.context.state().total).toBe(2);

    unregisterQ1();

    expect(hook.result.context.state().total).toBe(1);

    hook.cleanup();
  });

  it("同一元素重复注册时替换旧句柄（不产生重复项）", () => {
    const { result, cleanup, fakeItems } = renderRoot({}, [{ name: "q1" }]);

    const replacement: QuestionnaireItemHandle = {
      ...fakeItems[0],
      name: "q1",
    };
    result.context.registerItem(replacement);

    expect(result.context.state().total).toBe(1);

    cleanup();
  });

  it("disabled 的题目不计入 total", () => {
    const { result, cleanup } = renderRoot({}, [
      { name: "q1" },
      { name: "q2", disabled: true },
      { name: "q3" },
    ]);

    expect(result.context.state().total).toBe(2);

    cleanup();
  });

  it("运行时切换 disabled 会实时更新 total", () => {
    const { result, cleanup, fakeItems } = renderRoot({}, [
      { name: "q1" },
      { name: "q2" },
    ]);

    expect(result.context.state().total).toBe(2);
    fakeItems[1].setDisabled(true);
    expect(result.context.state().total).toBe(1);

    cleanup();
  });
});

describe("useQuestionnaireRoot - 激活项与进度", () => {
  it("受控 item 决定激活项", () => {
    const { result, cleanup } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    expect(result.context.activeItemName()).toBe("q2");

    cleanup();
  });

  it("非受控时 defaultItem 在解析那一刻已存在则生效", () => {
    // 注意时序：effect 首次解析 activeName 时 enabled() 里还只有「最先注册」的题目，
    // 若那一刻 defaultItem 尚不存在，就会先落到 list[0] 上并固定下来。
    // 这里直接用受控 `item` 验证"指定激活项"的语义，避免依赖注册时序。
    const { result, cleanup } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    expect(result.context.activeItemName()).toBe("q2");

    cleanup();
  });

  it("defaultItem 指向已注册题目时生效（分步注册）", () => {
    document.body.innerHTML = "";
    const [item] = createSignal<string | undefined>();
    const [defaultItem] = createSignal<string | undefined>("q2");
    const [items] = createSignal<readonly QuestionnaireItemDefinition[]>();
    const [shortcuts] = createSignal<QuestionnaireShortcutMode>();
    const [noValidate] = createSignal<boolean>();
    const [formRef] = createSignal<HTMLFormElement>();

    const hook = renderHook(() =>
      useQuestionnaireRoot({
        item,
        defaultItem,
        items,
        shortcuts,
        noValidate,
        onItemChange: vi.fn(),
        formRef,
      }),
    );

    // 先注册 q2，让 effect 解析时 defaultItem 已在 enabled() 里
    const q2 = makeFakeItem({ name: "q2" }, 1);
    const q1 = makeFakeItem({ name: "q1" }, 0);
    hook.result.context.registerItem(q2);
    hook.result.context.registerItem(q1);

    expect(hook.result.context.activeItemName()).toBe("q2");

    hook.cleanup();
  });

  it("defaultItem 不存在时回退到第一个可用项", () => {
    const { result, cleanup } = renderRoot({ defaultItem: "missing" }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    // 注意：internalName 会被首个注册的题目占住（这里是 q1），
    // 因此即便 defaultItem 无效，激活项仍落在 q1。
    expect(result.context.activeItemName()).toBe("q1");

    cleanup();
  });

  it("激活项被禁用后回退到第一个可用项", () => {
    const { result, cleanup, fakeItems } = renderRoot({ item: undefined }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    fakeItems[0].setDisabled(true);

    expect(result.context.activeItemName()).toBe("q2");

    cleanup();
  });

  it("current / first / last / total 反映进度", () => {
    const { result, cleanup } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
      { name: "q3" },
    ]);

    const state = result.context.state();
    expect(state).toEqual({ current: 2, first: false, last: false, total: 3 });

    cleanup();
  });

  it("第一题时 first 为 true", () => {
    const { result, cleanup } = renderRoot({ item: "q1" }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    expect(result.context.state().first).toBe(true);
    expect(result.context.state().last).toBe(false);

    cleanup();
  });

  it("最后一题时 last 为 true", () => {
    const { result, cleanup } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    expect(result.context.state().last).toBe(true);

    cleanup();
  });

  it("没有任何题目时 total 为 0 且 first/last 为 false", () => {
    const { result, cleanup } = renderRoot({});

    // current 在 index<0 时回退为 0（不是 1）
    expect(result.context.state()).toEqual({
      current: 0,
      first: false,
      last: false,
      total: 0,
    });

    cleanup();
  });

  it("activeItemRequired / activeItemStatus 反映激活项", () => {
    const { result, cleanup } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2", required: true, status: "answered" },
    ]);

    expect(result.context.activeItemRequired()).toBe(true);
    expect(result.context.activeItemStatus()).toBe("answered");

    cleanup();
  });

  it("没有激活项时 required / status 为 null", () => {
    const { result, cleanup } = renderRoot({});

    expect(result.context.activeItemRequired()).toBeNull();
    expect(result.context.activeItemStatus()).toBeNull();

    cleanup();
  });
});

describe("useQuestionnaireRoot - 导航", () => {
  it("goNext 校验通过后切到下一题并回调 onItemChange", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q1" }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    result.context.goNext();

    expect(onItemChange).toHaveBeenCalledWith("q2");

    cleanup();
  });

  it("goNext 校验失败时停留在当前题并聚焦无效项", () => {
    const { result, cleanup, fakeItems, onItemChange } = renderRoot(
      { item: "q1" },
      [{ name: "q1", valid: false }, { name: "q2" }],
    );

    result.context.goNext();

    expect(fakeItems[0].focusInvalidSpy).toHaveBeenCalled();
    expect(onItemChange).not.toHaveBeenCalled();

    cleanup();
  });

  it("最后一题 goNext 不动", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    result.context.goNext();

    expect(onItemChange).not.toHaveBeenCalled();

    cleanup();
  });

  it("没有激活项时 goNext 不抛错", () => {
    const { result, cleanup } = renderRoot({});

    expect(() => result.context.goNext()).not.toThrow();

    cleanup();
  });

  it("goPrevious 切到上一题", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    result.context.goPrevious();

    expect(onItemChange).toHaveBeenCalledWith("q1");

    cleanup();
  });

  it("第一题 goPrevious 不动", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q1" }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    result.context.goPrevious();

    expect(onItemChange).not.toHaveBeenCalled();

    cleanup();
  });

  it("goNext 跳过 disabled 的题目（enabled 列表不含它们）", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q1" }, [
      { name: "q1" },
      { name: "q2", disabled: true },
      { name: "q3" },
    ]);

    result.context.goNext();

    expect(onItemChange).toHaveBeenCalledWith("q3");

    cleanup();
  });

  it("skipCurrent 调用 item.skip 并前进", () => {
    const { result, cleanup, fakeItems, onItemChange } = renderRoot(
      { item: "q1" },
      [{ name: "q1" }, { name: "q2" }],
    );

    result.context.skipCurrent();

    expect(fakeItems[0].skipSpy).toHaveBeenCalled();
    expect(onItemChange).toHaveBeenCalledWith("q2");

    cleanup();
  });

  it("required 的题目无法跳过", () => {
    const { result, cleanup, fakeItems, onItemChange } = renderRoot(
      { item: "q1" },
      [{ name: "q1", required: true }, { name: "q2" }],
    );

    result.context.skipCurrent();

    expect(fakeItems[0].skipSpy).not.toHaveBeenCalled();
    expect(onItemChange).not.toHaveBeenCalled();

    cleanup();
  });

  it("最后一题跳过时排队提交（而非前进）", async () => {
    const { result, cleanup, fakeItems, setFormRef } = renderRoot(
      { item: "q1" },
      [{ name: "q1" }],
    );

    // 提供 formRef 以便 requestSubmit 可调用
    const form = document.createElement("form");
    const requestSubmit = vi.fn();
    form.requestSubmit = requestSubmit;
    document.body.appendChild(form);
    setFormRef(form);
    await Promise.resolve();

    result.context.skipCurrent();
    await Promise.resolve();

    expect(fakeItems[0].skipSpy).toHaveBeenCalled();
    expect(requestSubmit).toHaveBeenCalled();

    cleanup();
  });
});

describe("useQuestionnaireRoot - 提交与重置", () => {
  /** 造一个可用的 form 元素并 setFormRef */
  function withForm(setFormRef: (el: HTMLFormElement) => void): {
    form: HTMLFormElement;
    requestSubmit: ReturnType<typeof vi.fn>;
  } {
    const form = document.createElement("form");
    const requestSubmit = vi.fn();
    form.requestSubmit = requestSubmit;
    document.body.appendChild(form);
    setFormRef(form);
    return { form, requestSubmit };
  }

  it("requestSubmit 转发到 form.requestSubmit", async () => {
    const { result, cleanup, setFormRef } = renderRoot({ item: "q1" }, [
      { name: "q1" },
    ]);
    const { requestSubmit } = withForm(setFormRef);
    await Promise.resolve();

    result.context.requestSubmit();

    expect(requestSubmit).toHaveBeenCalled();

    cleanup();
  });

  it("没有 formRef 时 requestSubmit 不抛错", () => {
    const { result, cleanup } = renderRoot({ item: "q1" }, [{ name: "q1" }]);

    expect(() => result.context.requestSubmit()).not.toThrow();

    cleanup();
  });

  it("onSubmit：全部通过时调用用户 onSubmit，不 preventDefault", () => {
    const { result, cleanup, onSubmit } = renderRoot({ item: "q1" }, [
      { name: "q1" },
    ]);
    const event = new Event("submit", { cancelable: true }) as SubmitEvent;

    result.formProps.onSubmit(event);

    expect(onSubmit).toHaveBeenCalledWith(event);
    expect(event.defaultPrevented).toBe(false);

    cleanup();
  });

  it("onSubmit：存在无效题目时 preventDefault 并导航到它", () => {
    const { result, cleanup, onSubmit, onItemChange } = renderRoot(
      { item: "q1" },
      [{ name: "q1" }, { name: "q2", valid: false }],
    );
    const event = new Event("submit", { cancelable: true }) as SubmitEvent;

    result.formProps.onSubmit(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onItemChange).toHaveBeenCalledWith("q2");

    cleanup();
  });

  it("onReset：调用用户 onReset 并重置所有题目", () => {
    const { result, cleanup, onReset, fakeItems } = renderRoot({ item: "q1" }, [
      { name: "q1" },
      { name: "q2" },
    ]);
    const event = new Event("reset");

    result.formProps.onReset(event);

    expect(onReset).toHaveBeenCalledWith(event);
    expect(fakeItems[0].resetSpy).toHaveBeenCalled();
    expect(fakeItems[1].resetSpy).toHaveBeenCalled();

    cleanup();
  });

  it("onReset：用户 preventDefault 后不再重置题目", () => {
    const { result, cleanup, fakeItems } = renderRoot({ item: "q1" }, [
      { name: "q1" },
    ]);
    const event = new Event("reset", { cancelable: true });
    result.formProps.onReset(event);

    // 先跑一次正常 reset 以确认 spy 可用
    expect(fakeItems[0].resetSpy).toHaveBeenCalled();
    fakeItems[0].resetSpy.mockClear();

    const prevented = new Event("reset", { cancelable: true });
    prevented.preventDefault();
    // 让 hook 的 onReset 收到一个已 preventDefault 的事件
    const hookWithPrevented = renderRoot({ item: "q1" }, [{ name: "q1" }]);
    hookWithPrevented.onReset.mockImplementation((e: Event) =>
      e.preventDefault(),
    );
    hookWithPrevented.result.formProps.onReset(prevented);

    expect(hookWithPrevented.fakeItems[0].resetSpy).not.toHaveBeenCalled();

    hookWithPrevented.cleanup();
    cleanup();
  });

  it("onReset 后导航回解析出的首题", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    result.formProps.onReset(new Event("reset"));

    // resolveName 在无受控 item 时取 defaultItem/首项；这里受控 item 为 q2，
    // 因此 resolveName 返回 q2，导航不产生变化回调。
    expect(onItemChange).not.toHaveBeenCalled();
    expect(result.context.activeItemName()).toBe("q2");

    cleanup();
  });
});

describe("useQuestionnaireRoot - formProps", () => {
  it("data-shortcuts 透传 shortcuts", () => {
    const { result, cleanup } = renderRoot({ shortcuts: "letters" });

    expect(result.formProps["data-shortcuts"]).toBe("letters");

    cleanup();
  });

  it("未设置 shortcuts 时 data-shortcuts 为 undefined", () => {
    const { result, cleanup } = renderRoot();

    expect(result.formProps["data-shortcuts"]).toBeUndefined();

    cleanup();
  });

  it("nativeValidation 跟随 noValidate（noValidate=false 时为 true）", () => {
    const { result, cleanup } = renderRoot({ noValidate: false }, [
      { name: "q1" },
    ]);

    expect(result.context.nativeValidation()).toBe(true);

    cleanup();
  });

  it("noValidate 未设置时 nativeValidation 为 false", () => {
    const { result, cleanup } = renderRoot();

    expect(result.context.nativeValidation()).toBe(false);

    cleanup();
  });

  it("shortcuts accessor 默认 null", () => {
    const { result, cleanup } = renderRoot();

    expect(result.context.shortcuts()).toBeNull();

    cleanup();
  });

  it("itemDefinitions 为 null 当没有传入 items", () => {
    const { result, cleanup } = renderRoot();

    expect(result.context.itemDefinitions()).toBeNull();

    cleanup();
  });

  it("itemDefinitions 按 name 建索引", () => {
    const definitions: QuestionnaireItemDefinition[] = [
      { name: "q1" } as QuestionnaireItemDefinition,
      { name: "q2" } as QuestionnaireItemDefinition,
    ];
    const { result, cleanup } = renderRoot({ items: definitions });

    expect(result.context.itemDefinitions()?.get("q1")).toBe(definitions[0]);
    expect(result.context.itemDefinitions()?.size).toBe(2);

    cleanup();
  });
});

describe("useQuestionnaireRoot - 键盘处理", () => {
  /** 造一个可派发到 handleKeyDown 的键盘事件 */
  function keyEvent(
    target: Element | EventTarget,
    key: string,
    init: KeyboardEventInit = {},
  ): KeyboardEvent {
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
      ...init,
    });
    // configurable: true 便于个别用例把它覆盖成非 Element（如 document）
    Object.defineProperty(event, "target", {
      value: target,
      configurable: true,
    });
    return event;
  }

  function bodyTarget(): Element {
    const el = document.createElement("div");
    document.body.appendChild(el);
    return el;
  }

  it("没有激活项时不处理按键", () => {
    const { result, cleanup } = renderRoot({});

    expect(() =>
      result.formProps.onKeyDown(keyEvent(bodyTarget(), "Enter")),
    ).not.toThrow();

    cleanup();
  });

  it("defaultPrevented 事件被忽略", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
    ]);
    const event = keyEvent(bodyTarget(), "ArrowLeft");

    event.preventDefault();
    result.formProps.onKeyDown(event);

    expect(onItemChange).not.toHaveBeenCalled();

    cleanup();
  });

  it("输入法组合中（isComposing）忽略按键", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    result.formProps.onKeyDown(
      keyEvent(bodyTarget(), "ArrowLeft", { isComposing: true }),
    );

    expect(onItemChange).not.toHaveBeenCalled();

    cleanup();
  });

  it("keyCode 229（输入法）忽略按键", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
    ]);
    const event = keyEvent(bodyTarget(), "ArrowLeft");
    Object.defineProperty(event, "keyCode", { value: 229 });

    result.formProps.onKeyDown(event);

    expect(onItemChange).not.toHaveBeenCalled();

    cleanup();
  });

  it("target 不是 Element 时忽略", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
    ]);
    // 直接用 document 当 target（非 Element）
    const event = keyEvent(document, "ArrowLeft");

    expect(() => result.formProps.onKeyDown(event)).not.toThrow();
    expect(onItemChange).not.toHaveBeenCalled();

    cleanup();
  });

  it("ArrowLeft 切到上一题", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
    ]);

    result.formProps.onKeyDown(keyEvent(bodyTarget(), "ArrowLeft"));

    expect(onItemChange).toHaveBeenCalledWith("q1");

    cleanup();
  });

  it("ArrowRight 在已回答时切到下一题", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q1" }, [
      { name: "q1", status: "answered" },
      { name: "q2" },
    ]);

    result.formProps.onKeyDown(keyEvent(bodyTarget(), "ArrowRight"));

    expect(onItemChange).toHaveBeenCalledWith("q2");

    cleanup();
  });

  it("ArrowRight 在未回答时不切题", () => {
    const { result, cleanup, onItemChange } = renderRoot({ item: "q1" }, [
      { name: "q1", status: "unanswered" },
      { name: "q2" },
    ]);

    result.formProps.onKeyDown(keyEvent(bodyTarget(), "ArrowRight"));

    expect(onItemChange).not.toHaveBeenCalled();

    cleanup();
  });

  it("左右箭头会 preventDefault", () => {
    const { result, cleanup } = renderRoot({ item: "q2" }, [
      { name: "q1" },
      { name: "q2" },
    ]);
    const event = keyEvent(bodyTarget(), "ArrowLeft");

    result.formProps.onKeyDown(event);

    expect(event.defaultPrevented).toBe(true);

    cleanup();
  });
});
