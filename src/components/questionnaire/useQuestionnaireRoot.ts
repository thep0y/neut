import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type Accessor,
} from "solid-js";
import type {
  QuestionnaireItemHandle,
  QuestionnaireRootContextValue,
} from "./questionnaire.context";
import type {
  QuestionnaireItemDefinition,
  QuestionnaireShortcutMode,
} from "./questionnaire.types";
import {
  compareDocumentOrder,
  isAnswerFilled,
  isNativeRadio,
  isTypingElement,
  normalizeShortcut,
} from "./questionnaire.utils";

interface Options {
  item: Accessor<string | undefined>;
  defaultItem: Accessor<string | undefined>;
  items: Accessor<readonly QuestionnaireItemDefinition[] | undefined>;
  shortcuts: Accessor<QuestionnaireShortcutMode | undefined>;
  noValidate: Accessor<boolean | undefined>;
  onItemChange: (item: string) => void;
  onReset?: (event: Event) => void;
  onSubmit?: (event: SubmitEvent) => void;
  formRef: Accessor<HTMLFormElement | undefined>;
}

/**
 * Questionnaire 根状态机:
 * - 注册各 Item(按 DOM 顺序排序),维护激活项与进度;
 * - 导航(上一题/下一题/跳过/提交)与校验;
 * - 键盘:Mod+Enter 提交、上下箭头在答案间移动、左右箭头切题、方向键/Esc/快捷键。
 */
export function useQuestionnaireRoot(options: Options): {
  context: QuestionnaireRootContextValue;
  formProps: {
    "data-shortcuts": string | undefined;
    onKeyDown: (event: KeyboardEvent) => void;
    onSubmit: (event: SubmitEvent) => void;
    onReset: (event: Event) => void;
  };
} {
  const [registered, setRegistered] = createSignal<QuestionnaireItemHandle[]>(
    [],
  );
  const [domVersion, setDomVersion] = createSignal(0);
  const [internalName, setInternalName] = createSignal<string | null>(null);
  let pendingFocus: { name: string; target: "item" | "invalid" } | null = null;

  const ordered = createMemo(() => {
    domVersion();
    return [...registered()].sort((a, b) =>
      compareDocumentOrder(a.element, b.element),
    );
  });
  const enabled = createMemo(() =>
    ordered().filter((item) => !item.disabled()),
  );
  const activeName = createMemo(() => options.item() ?? internalName());
  const activeItem = createMemo(
    () => enabled().find((item) => item.name === activeName()) ?? null,
  );
  const total = createMemo(() => enabled().length);
  const index = createMemo(() =>
    enabled().findIndex((item) => item.name === activeName()),
  );
  const current = createMemo(() => (index() < 0 ? 0 : index() + 1));
  const first = createMemo(() => total() > 0 && index() === 0);
  const last = createMemo(() => total() > 0 && index() === total() - 1);

  const itemDefinitions = createMemo(() => {
    const list = options.items();
    if (!list) return null;
    return new Map(list.map((definition) => [definition.name, definition]));
  });

  const resolveName = () => {
    const list = enabled();
    const candidate = options.item() ?? options.defaultItem();
    if (candidate && list.some((entry) => entry.name === candidate)) {
      return candidate;
    }
    return list[0]?.name ?? null;
  };

  // 激活项不可用时回退到定义/第一个可用项
  createEffect(() => {
    if (options.item() !== undefined) return;
    const list = enabled();
    const name = activeName();
    if (name && list.some((entry) => entry.name === name)) return;
    const next = resolveName();
    if (next !== name) setInternalName(next);
  });

  const registerItem = (handle: QuestionnaireItemHandle) => {
    setRegistered((prev) => {
      const exists = prev.some((item) => item.element === handle.element);
      return exists
        ? prev.map((item) => (item.element === handle.element ? handle : item))
        : [...prev, handle];
    });
    return () => {
      setRegistered((prev) => prev.filter((item) => item !== handle));
    };
  };

  const navigate = (
    name: string | null,
    target: "item" | "invalid" = "item",
  ) => {
    if (!name) return;
    if (name === activeName()) {
      if (target === "invalid") activeItem()?.focusInvalid();
      return;
    }
    pendingFocus = { name, target };
    if (options.item() === undefined) setInternalName(name);
    options.onItemChange?.(name);
  };

  const requestSubmit = () => options.formRef()?.requestSubmit();

  const goNext = () => {
    const item = activeItem();
    if (!item) return;
    if (!item.validate()) {
      item.focusInvalid();
      return;
    }
    const list = enabled();
    const position = list.indexOf(item);
    if (position < 0 || position >= list.length - 1) return;
    navigate(list[position + 1]!.name);
  };

  const goPrevious = () => {
    const list = enabled();
    const position = index();
    if (position <= 0) return;
    navigate(list[position - 1]!.name);
  };

  const skipCurrent = () => {
    const item = activeItem();
    if (!item || item.required()) return;
    item.skip();
    if (last()) {
      queueMicrotask(requestSubmit);
      return;
    }
    const list = enabled();
    const position = list.indexOf(item);
    navigate(list[position + 1]?.name ?? null);
  };

  const submitOrNext = () => {
    if (last()) requestSubmit();
    else goNext();
  };

  const handleSubmit = (event: SubmitEvent) => {
    const invalid = enabled().find((item) => !item.validate());
    if (invalid) {
      event.preventDefault();
      navigate(invalid.name, "invalid");
      return;
    }
    options.onSubmit?.(event);
  };

  const handleReset = (event: Event) => {
    options.onReset?.(event);
    if (event.defaultPrevented) return;
    for (const item of enabled()) item.reset();
    navigate(resolveName());
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const item = activeItem();
    if (!item) return;
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.keyCode === 229 ||
      !(event.target instanceof Element)
    ) {
      return;
    }
    const target = event.target;

    if (
      event.key === "Enter" &&
      (event.metaKey || event.ctrlKey) &&
      !event.altKey &&
      !event.shiftKey
    ) {
      event.preventDefault();
      if (!event.repeat) submitOrNext();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (
      (event.key === "ArrowUp" || event.key === "ArrowDown") &&
      item.moveAnswerFocus(
        target,
        event.key === "ArrowDown" ? "next" : "previous",
      )
    ) {
      event.preventDefault();
      return;
    }

    if (
      (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      !isTypingElement(target) &&
      !isNativeRadio(target)
    ) {
      event.preventDefault();
      if (event.repeat) return;
      if (event.key === "ArrowLeft") goPrevious();
      else if (item.status() !== "unanswered") goNext();
      return;
    }

    if (event.key === "Enter") {
      const answer = item.getAnswerByElement(target);
      if (!answer) return;
      event.preventDefault();
      if (!event.repeat && isAnswerFilled(answer)) submitOrNext();
      return;
    }

    const mode = options.shortcuts() ?? null;
    if (!mode || isTypingElement(target)) return;
    const shortcut = normalizeShortcut(event.key, mode);
    const answer = shortcut ? item.getAnswerByShortcut(shortcut) : null;
    if (!answer) return;
    event.preventDefault();
    if (event.repeat) return;
    answer.element.focus();
    if (answer.type === "choice") (answer.element as HTMLInputElement).click();
  };

  // 导航后聚焦新激活项(或它的首个答案控件)
  createEffect(() => {
    const name = activeName();
    if (!pendingFocus || pendingFocus.name !== name) return;
    const target = pendingFocus.target;
    pendingFocus = null;
    const handle = enabled().find((item) => item.name === name);
    if (!handle) return;
    queueMicrotask(() => {
      if (target === "invalid") handle.focusInvalid();
      else handle.focus();
    });
  });

  // 观察 DOM 变化(动态增删 Item)以便重新排序
  createEffect(() => {
    const form = options.formRef();
    if (!form || typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(() => setDomVersion((v) => v + 1));
    observer.observe(form, { childList: true, subtree: true });
    onCleanup(() => observer.disconnect());
  });

  const context: QuestionnaireRootContextValue = {
    state: () => ({
      current: current(),
      first: first(),
      last: last(),
      total: total(),
    }),
    activeItemName: activeName,
    activeItemRequired: () => activeItem()?.required() ?? null,
    activeItemStatus: () => activeItem()?.status() ?? null,
    shortcuts: () => options.shortcuts() ?? null,
    nativeValidation: () => options.noValidate() === false,
    itemDefinitions,
    registerItem,
    goNext,
    goPrevious,
    skipCurrent,
    requestSubmit,
  };

  return {
    context,
    formProps: {
      "data-shortcuts": options.shortcuts(),
      onKeyDown: handleKeyDown,
      onSubmit: handleSubmit,
      onReset: handleReset,
    },
  };
}
