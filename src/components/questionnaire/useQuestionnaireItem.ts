import { createMemo, createSignal, type Accessor } from "solid-js";
import {
  useQuestionnaireRootContext,
  type QuestionnaireAnswerEntry,
  type QuestionnaireItemContextValue,
  type QuestionnaireItemHandle,
} from "./questionnaire.context";
import type { QuestionnaireItemStatus } from "./questionnaire.types";
import {
  buildShortcutByAnswerId,
  buildShortcutByChoiceValue,
  findAnswerByShortcut,
} from "./questionnaire.shortcuts";
import {
  isAnswerFilled,
  isNativeRadio,
  isTypingElement,
} from "./questionnaire.utils";

interface Options {
  name: string;
  required: Accessor<boolean>;
  multiple: Accessor<boolean>;
  disabled: Accessor<boolean>;
  invalid: Accessor<boolean>;
  onStatusChange?: (status: QuestionnaireItemStatus) => void;
}

export interface QuestionnaireItemDomProps {
  "aria-describedby": string | undefined;
  "aria-invalid": boolean | undefined;
  "aria-keyshortcuts": string | undefined;
  disabled: boolean;
  hidden: boolean;
  inert: boolean;
  tabIndex: number;
}

export interface UseQuestionnaireItemResult {
  context: QuestionnaireItemContextValue;
  /** 反应式:每次读取都根据当前 active/invalid 重新计算 */
  itemProps: () => QuestionnaireItemDomProps;
  describedBy: () => string | undefined;
  keyshortcuts: () => string | undefined;
  /** 在 fieldset 的 ref 里调用:登记 DOM 元素并把句柄注册到 Root */
  registerElement: (element: HTMLElement) => () => void;
}

/**
 * 单个题目的状态:答案注册与选中、跳过、校验、快捷键,以及给 Root 的句柄。
 */
export function useQuestionnaireItem(
  options: Options,
): UseQuestionnaireItemResult {
  const root = useQuestionnaireRootContext("QuestionnaireItem");

  const [element, setElement] = createSignal<HTMLElement>();
  const [answers, setAnswers] = createSignal<QuestionnaireAnswerEntry[]>([]);
  const [selections, setSelections] = createSignal<string[]>([]);
  const [defaults, setDefaults] = createSignal<string[]>([]);
  const [skipped, setSkipped] = createSignal(false);
  const [touched, setTouched] = createSignal(false);
  const [resetVersion, setResetVersion] = createSignal(0);
  const [descriptionIds, setDescriptionIds] = createSignal<string[]>([]);
  const [errorIds, setErrorIds] = createSignal<string[]>([]);

  const active = createMemo(() => root.activeItemName() === options.name);

  const registerAnswerControl = (entry: QuestionnaireAnswerEntry) => {
    setAnswers((prev) => [
      ...prev.filter(
        (item) => item.id !== entry.id && item.element !== entry.element,
      ),
      entry,
    ]);
    return () => setAnswers((prev) => prev.filter((item) => item !== entry));
  };

  const applySelection = (id: string, selected: boolean) => {
    setSelections((prev) => {
      if (selected) {
        return options.multiple()
          ? prev.includes(id)
            ? prev
            : [...prev, id]
          : [id];
      }
      return prev.filter((value) => value !== id);
    });
  };

  const registerAnswerSelection = (id: string, initialSelected: boolean) => {
    if (initialSelected) {
      setSelections((prev) =>
        options.multiple()
          ? prev.includes(id)
            ? prev
            : [...prev, id]
          : prev.length
            ? prev
            : [id],
      );
    }
    return () => {
      setSelections((prev) => prev.filter((value) => value !== id));
      setDefaults((prev) => prev.filter((value) => value !== id));
    };
  };

  const setAnswerDefault = (id: string, selected: boolean) => {
    setDefaults((prev) => {
      if (selected) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((value) => value !== id);
    });
  };

  const setAnswerSelectionFromInteraction = (id: string, selected: boolean) => {
    setSkipped(false);
    applySelection(id, selected);
  };

  const syncControlledAnswerSelection = (id: string, selected: boolean) => {
    applySelection(id, selected);
  };

  const isEntryDisabled = (entry: QuestionnaireAnswerEntry) =>
    entry.disabled || entry.element.disabled;

  const hasInputAnswer = createMemo(() =>
    answers().some(
      (entry) =>
        entry.type === "input" &&
        !["button", "checkbox", "radio", "reset", "submit"].includes(
          entry.element.type,
        ),
    ),
  );

  const status = createMemo<QuestionnaireItemStatus>(() => {
    if (skipped()) return "skipped";
    const selected = selections();
    const answered = answers().some(
      (entry) => selected.includes(entry.id) && !isEntryDisabled(entry),
    );
    return answered ? "answered" : "unanswered";
  });

  const skippable = createMemo(
    () => status() === "skipped" && !options.required(),
  );
  const answeredOk = createMemo(() => status() === "answered");

  const invalid = createMemo(
    () =>
      !options.disabled() &&
      !skippable() &&
      (options.invalid() ||
        (touched() && !(skippable() || (!options.invalid() && answeredOk())))),
  );

  const focus = () => {
    const target = element();
    if (!target) return;
    const filled = target.querySelector<HTMLElement>(
      "input[data-filled][name]:not(:disabled)",
    );
    const anyInput = target.querySelector<HTMLElement>(
      "input:not([type=hidden]):not(:disabled), textarea:not(:disabled)",
    );
    (filled ?? anyInput ?? target).focus();
  };

  const validate = () => {
    setTouched(true);
    const satisfied =
      options.disabled() ||
      (status() === "skipped" && !options.required()) ||
      (!options.invalid() && status() === "answered");
    if (!satisfied) return false;
    if (!root.nativeValidation()) return true;
    const answer = answers().find(
      (entry) =>
        isAnswerFilled(entry) &&
        entry.element.willValidate &&
        !entry.element.validity.valid,
    );
    if (answer) {
      answer.element.focus();
      answer.element.reportValidity();
      return false;
    }
    return true;
  };

  const skip = () => {
    if (options.required()) return;
    setSelections([]);
    setSkipped(true);
  };

  const reset = () => {
    setTouched(false);
    setSkipped(false);
    setSelections(
      options.multiple() ? [...defaults()] : defaults().slice(0, 1),
    );
    setResetVersion((value) => value + 1);
  };

  const getAnswerByElement = (target: Element) =>
    answers().find((entry) => entry.element === target) ?? null;

  const shortcutByChoiceValue = createMemo(() =>
    buildShortcutByChoiceValue(
      root.itemDefinitions()?.get(options.name),
      root.shortcuts(),
    ),
  );

  const shortcutByAnswerId = createMemo(() =>
    buildShortcutByAnswerId(
      answers(),
      shortcutByChoiceValue() !== null,
      root.shortcuts(),
    ),
  );

  const getAnswerByShortcut = (shortcut: string) =>
    findAnswerByShortcut(shortcut, {
      byChoiceValue: shortcutByChoiceValue(),
      byAnswerId: shortcutByAnswerId(),
      answers: answers(),
    });

  const moveAnswerFocus = (target: Element, direction: "next" | "previous") => {
    const scope = element();
    const focusable = answers().filter(
      (entry) =>
        !isEntryDisabled(entry) &&
        entry.element.isConnected &&
        !(isTypingElement(target) && entry.type === "input"),
    );
    if (!focusable.length) return false;
    const position = focusable.findIndex((entry) => entry.element === target);
    if (position < 0 && target !== scope) return false;
    const nextIndex =
      position < 0
        ? direction === "next"
          ? 0
          : focusable.length - 1
        : (position + (direction === "next" ? 1 : -1) + focusable.length) %
          focusable.length;
    const next = focusable[nextIndex];
    if (!next || next.element === target) return false;
    next.element.focus();
    if (next.type === "choice" && isNativeRadio(next.element)) {
      (next.element as HTMLInputElement).click();
    }
    return true;
  };

  const describedBy = () => {
    const ids = [...descriptionIds(), ...(invalid() ? errorIds() : [])];
    return [...new Set(ids)].join(" ") || undefined;
  };

  const keyshortcuts = () => {
    if (!active()) return undefined;
    const state = root.state();
    return (
      [
        "Meta+Enter Control+Enter",
        answers().length ? "ArrowUp ArrowDown" : null,
        !state.first ? "ArrowLeft" : null,
        !state.last && status() !== "unanswered" ? "ArrowRight" : null,
      ]
        .filter(Boolean)
        .join(" ") || undefined
    );
  };

  const registerDescription = (id: string) => {
    setDescriptionIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    return () =>
      setDescriptionIds((prev) => prev.filter((value) => value !== id));
  };

  const registerError = (id: string) => {
    setErrorIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    return () => setErrorIds((prev) => prev.filter((value) => value !== id));
  };

  const context: QuestionnaireItemContextValue = {
    name: options.name,
    active,
    disabled: options.disabled,
    invalid,
    multiple: options.multiple,
    required: options.required,
    status,
    hasInputAnswer,
    selectedAnswerIds: selections,
    resetVersion,
    shortcutByAnswerId,
    shortcutByChoiceValue,
    shortcuts: root.shortcuts,
    registerAnswerControl,
    registerAnswerSelection,
    registerDescription,
    registerError,
    setAnswerDefault,
    setAnswerSelectionFromInteraction,
    syncControlledAnswerSelection,
  };

  const registerElement = (target: HTMLElement) => {
    setElement(target);
    const handle: QuestionnaireItemHandle = {
      name: options.name,
      element: target,
      disabled: options.disabled,
      required: options.required,
      status,
      validate,
      focus,
      focusInvalid: focus,
      skip,
      reset,
      getAnswerByElement,
      getAnswerByShortcut,
      moveAnswerFocus,
    };
    return root.registerItem(handle);
  };

  return {
    context,
    itemProps: () => ({
      "aria-describedby": describedBy(),
      "aria-invalid": invalid() || undefined,
      "aria-keyshortcuts": keyshortcuts(),
      disabled: options.disabled(),
      hidden: !active(),
      inert: !active(),
      tabIndex: -1,
    }),
    registerElement,
    describedBy,
    keyshortcuts,
  };
}
