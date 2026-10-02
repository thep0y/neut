import {
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  type Accessor,
} from "solid-js";
import { useQuestionnaireItemContext } from "../questionnaire.context";
import { keyShortcutText } from "../questionnaire.utils";
import {
  decideChoiceSelectionChange,
  isChoiceRequired,
  resolveChoiceChecked,
  resolveChoiceName,
  resolveChoiceShortcut,
} from "./questionnaire-choice.utils";

interface Options {
  value: string;
  checked?: Accessor<boolean | undefined>;
  defaultChecked?: Accessor<boolean>;
  disabled?: Accessor<boolean>;
  onChange?: (event: Event) => void;
}

/**
 * 固定选项的状态:选中由 Item 的选中集合驱动(受控时用 checked),
 * 同时把 input 注册成 Item 的 answer control,以便校验与快捷键。
 */
export function useQuestionnaireChoice(options: Options) {
  const item = useQuestionnaireItemContext("QuestionnaireChoice");
  const id = createUniqueId();
  const [input, setInput] = createSignal<HTMLInputElement>();

  const isDisabled = () => item.disabled() || !!options.disabled?.();
  const type = () => (item.multiple() ? "checkbox" : "radio");
  const shortcut = () =>
    resolveChoiceShortcut({
      byChoiceValue: item.shortcutByChoiceValue(),
      byAnswerId: item.shortcutByAnswerId(),
      value: options.value,
      id,
    });

  const required = () =>
    isChoiceRequired({
      required: item.required(),
      multiple: item.multiple(),
      hasInputAnswer: item.hasInputAnswer(),
    });

  const name = () => resolveChoiceName(item.status(), item.name);

  onCleanup(item.registerAnswerSelection(id, !!options.defaultChecked?.()));
  createEffect(() => item.setAnswerDefault(id, !!options.defaultChecked?.()));

  createEffect(() => {
    const element = input();
    if (!element) return;
    const unregister = item.registerAnswerControl({
      id,
      element,
      type: "choice",
      value: options.value,
      disabled: isDisabled(),
      ownDisabled: !!options.disabled?.(),
    });
    onCleanup(unregister);
  });

  const checkedResolved = () =>
    resolveChoiceChecked({
      controlled: options.checked?.(),
      status: item.status(),
      selectedAnswerIds: item.selectedAnswerIds(),
      id,
    });

  // 受控同步 + reset 后强制同步 DOM checked
  createEffect(() => {
    const element = input();
    const controlled = options.checked?.();
    item.resetVersion();
    if (element && controlled !== undefined) {
      item.syncControlledAnswerSelection(id, controlled);
    }
    if (element) element.checked = checkedResolved();
  });

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    options.onChange?.(event);
    const next = decideChoiceSelectionChange({
      canceled: event.defaultPrevented,
      controlled: options.checked?.(),
      status: item.status(),
      checked: target.checked,
    });
    if (next !== null) item.setAnswerSelectionFromInteraction(id, next);
  };

  /** aria-keyshortcuts：只有"可用且当前勾选"时才附上 Enter 提示 */
  const ariaKeyShortcuts = () =>
    keyShortcutText(shortcut(), !isDisabled() && checkedResolved());

  return {
    id,
    setInput,
    type,
    isDisabled,
    shortcut,
    checkedResolved,
    handleChange,
    invalid: item.invalid,
    required,
    name,
    ariaKeyShortcuts,
    inputProps: () => ({
      "aria-keyshortcuts": ariaKeyShortcuts(),
      "aria-invalid": item.invalid() || undefined,
      checked: checkedResolved(),
      disabled: isDisabled(),
      id,
      name: name(),
      onChange: handleChange,
      required: required(),
      type: type(),
      value: options.value,
    }),
  };
}
