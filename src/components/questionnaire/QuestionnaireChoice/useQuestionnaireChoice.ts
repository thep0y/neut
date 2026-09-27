import {
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  type Accessor,
} from "solid-js";
import { useQuestionnaireItemContext } from "../questionnaire.context";
import { keyShortcutText } from "../questionnaire.utils";

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
    item.shortcutByChoiceValue()?.get(options.value) ??
    item.shortcutByAnswerId().get(id) ??
    null;

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

  const checkedResolved = () => {
    const controlled = options.checked?.();
    if (controlled !== undefined) {
      return item.status() === "skipped" ? false : controlled;
    }
    return item.selectedAnswerIds().includes(id);
  };

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
    if (event.defaultPrevented) return;
    const controlled = options.checked?.();
    if (controlled === undefined) {
      item.setAnswerSelectionFromInteraction(id, target.checked);
      return;
    }
    if (item.status() === "skipped" && controlled === target.checked) {
      item.setAnswerSelectionFromInteraction(id, controlled);
    }
  };

  return {
    id,
    setInput,
    type,
    isDisabled,
    shortcut,
    checkedResolved,
    handleChange,
    invalid: item.invalid,
    required: () =>
      item.required() && !item.multiple() && !item.hasInputAnswer(),
    name: () => (item.status() === "skipped" ? undefined : item.name),
    inputProps: () => ({
      "aria-keyshortcuts": keyShortcutText(
        shortcut(),
        !isDisabled() && checkedResolved(),
      ),
      "aria-invalid": item.invalid() || undefined,
      checked: checkedResolved(),
      disabled: isDisabled(),
      id,
      name: item.status() === "skipped" ? undefined : item.name,
      onChange: handleChange,
      required: item.required() && !item.multiple() && !item.hasInputAnswer(),
      type: type(),
      value: options.value,
    }),
  };
}
