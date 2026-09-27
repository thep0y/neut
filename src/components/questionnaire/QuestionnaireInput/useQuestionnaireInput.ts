import {
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  type Accessor,
} from "solid-js";
import { useQuestionnaireItemContext } from "../questionnaire.context";
import { hasText, keyShortcutText } from "../questionnaire.utils";

interface Options {
  type: Accessor<string>;
  defaultValue: Accessor<string | undefined>;
  value: Accessor<string | undefined>;
  disabled: Accessor<boolean | undefined>;
  onChange?: (event: Event) => void;
}

/**
 * 自由作答输入:作为 Item 的一个 answer control 参与校验与 FormData。
 * 选中时才有 name(参与提交),否则用 form="" 排除在表单之外。
 */
export function useQuestionnaireInput(options: Options) {
  const item = useQuestionnaireItemContext("QuestionnaireInput");
  const id = createUniqueId();
  const [input, setInput] = createSignal<HTMLInputElement>();
  const initialFilled = hasText(options.defaultValue());
  const [internalFilled, setInternalFilled] = createSignal(initialFilled);
  const [resetSeen, setResetSeen] = createSignal(0);

  const controlled = () => options.value() !== undefined;
  const isDisabled = () => item.disabled() || !!options.disabled?.();
  const selected = () => item.selectedAnswerIds().includes(id);
  const filled = () =>
    controlled() ? hasText(options.value()) : internalFilled();

  onCleanup(item.registerAnswerSelection(id, initialFilled));
  createEffect(() => item.setAnswerDefault(id, initialFilled));

  createEffect(() => {
    const element = input();
    if (!element) return;
    const unregister = item.registerAnswerControl({
      id,
      element,
      type: "input",
      disabled: isDisabled(),
    });
    onCleanup(unregister);
  });

  createEffect(() => {
    const version = item.resetVersion();
    if (version === resetSeen()) return;
    setResetSeen(version);
    if (!controlled()) setInternalFilled(initialFilled);
  });

  createEffect(() => {
    const element = input();
    const value = options.value();
    if (!element) return;
    if (controlled()) {
      item.syncControlledAnswerSelection(id, hasText(value));
    } else if (value !== undefined) {
      element.defaultValue = String(value);
    }
  });

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    options.onChange?.(event);
    if (event.defaultPrevented) return;
    const nextFilled = hasText(target.value);
    if (!controlled()) setInternalFilled(nextFilled);
    item.setAnswerSelectionFromInteraction(id, nextFilled);
  };

  return {
    id,
    setInput,
    selected,
    filled,
    isDisabled,
    invalid: item.invalid,
    controlled,
    name: () => (selected() ? item.name : undefined),
    formValue: () => (selected() ? undefined : ""),
    ariaKeyShortcuts: () =>
      keyShortcutText(null, !isDisabled() && filled() && selected()),
    inputProps: () => ({
      "aria-invalid": item.invalid() || undefined,
      "aria-keyshortcuts": keyShortcutText(
        null,
        !isDisabled() && filled() && selected(),
      ),
      defaultValue: controlled() ? undefined : options.defaultValue(),
      disabled: isDisabled(),
      form: selected() ? undefined : "",
      id,
      name: selected() ? item.name : undefined,
      onChange: handleChange,
      type: options.type(),
      value: controlled() ? options.value() : undefined,
    }),
  };
}
