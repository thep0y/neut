import { createMemo, createSignal, type Accessor } from "solid-js";
import {
  useQuestionnaireRootContext,
  type QuestionnaireItemContextValue,
  type QuestionnaireItemHandle,
} from "./questionnaire.context";
import {
  buildDescribedBy,
  buildItemKeyshortcuts,
  createIdRegistry,
} from "./questionnaire.aria";
import { createAnswerBookkeeping } from "./questionnaire.answers";
import {
  focusItem,
  moveAnswerFocus as moveAnswerFocusInItem,
} from "./questionnaire.focus";
import {
  buildShortcutByAnswerId,
  buildShortcutByChoiceValue,
  findAnswerByShortcut,
} from "./questionnaire.shortcuts";
import {
  findNativeInvalidAnswer,
  isItemSatisfied,
  resolveItemInvalid,
} from "./questionnaire.validation";

interface Options {
  name: string;
  required: Accessor<boolean>;
  multiple: Accessor<boolean>;
  disabled: Accessor<boolean>;
  invalid: Accessor<boolean>;
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

  const book = createAnswerBookkeeping({
    multiple: options.multiple,
    required: options.required,
  });
  const {
    answers,
    selections,
    touched,
    resetVersion,
    status,
    skippable,
    answeredOk,
    hasInputAnswer,
    registerAnswerControl,
    registerAnswerSelection,
    setAnswerDefault,
    setAnswerSelectionFromInteraction,
    syncControlledAnswerSelection,
    getAnswerByElement,
  } = book;

  const descriptions = createIdRegistry();
  const errors = createIdRegistry();

  const active = createMemo(() => root.activeItemName() === options.name);

  const invalid = createMemo(() =>
    resolveItemInvalid({
      disabled: options.disabled(),
      invalid: options.invalid(),
      skippable: skippable(),
      touched: touched(),
      answeredOk: answeredOk(),
    }),
  );

  const focus = () => focusItem(element());

  const validate = () => {
    book.markTouched();
    const satisfied = isItemSatisfied({
      disabled: options.disabled(),
      status: status(),
      required: options.required(),
      invalid: options.invalid(),
    });
    if (!satisfied) return false;
    if (!root.nativeValidation()) return true;

    const answer = findNativeInvalidAnswer(answers());
    if (!answer) return true;
    answer.element.focus();
    answer.element.reportValidity();
    return false;
  };

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

  const moveAnswerFocus = (target: Element, direction: "next" | "previous") =>
    moveAnswerFocusInItem({
      scope: element(),
      target,
      direction,
      answers: answers(),
    });

  const describedBy = () =>
    buildDescribedBy(descriptions.ids(), errors.ids(), invalid());

  const keyshortcuts = () =>
    buildItemKeyshortcuts({
      active: active(),
      hasAnswers: answers().length > 0,
      first: root.state().first,
      last: root.state().last,
      status: status(),
    });

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
    registerDescription: descriptions.register,
    registerError: errors.register,
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
      skip: book.skip,
      reset: book.reset,
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
