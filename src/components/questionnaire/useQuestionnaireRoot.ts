import { createEffect, createSignal, type Accessor } from "solid-js";
import type { QuestionnaireRootContextValue } from "./questionnaire.context";
import type {
  QuestionnaireItemDefinition,
  QuestionnaireShortcutMode,
} from "./questionnaire.types";
import { createDomVersionWatcher } from "./questionnaire.dom-watch";
import { createItemView, resolveActiveName } from "./questionnaire.item-view";
import { handleQuestionnaireKeyDown } from "./questionnaire.keys";
import { createItemRegistry } from "./questionnaire.registry";

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
  const registry = createItemRegistry();
  const domVersion = createDomVersionWatcher(options.formRef);
  const [internalName, setInternalName] = createSignal<string | null>(null);
  let pendingFocus: { name: string; target: "item" | "invalid" } | null = null;

  const view = createItemView({
    registered: registry.items,
    domVersion,
    controlledItem: options.item,
    internalName,
    definitions: options.items,
  });
  const { enabled, activeName, activeItem, total, index, first, last } = view;
  const { current, itemDefinitions } = view;

  const resolveName = () =>
    resolveActiveName({
      enabled: enabled(),
      controlledItem: options.item(),
      defaultItem: options.defaultItem(),
    });

  // 激活项不可用时回退到定义/第一个可用项
  createEffect(() => {
    if (options.item() !== undefined) return;
    const list = enabled();
    const name = activeName();
    if (name && list.some((entry) => entry.name === name)) return;
    const next = resolveName();
    if (next !== name) setInternalName(next);
  });

  const registerItem = registry.register;

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

    handleQuestionnaireKeyDown(event, {
      item,
      status: () => item.status(),
      shortcuts: options.shortcuts() ?? null,
      goNext,
      goPrevious,
      submitOrNext,
    });
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
