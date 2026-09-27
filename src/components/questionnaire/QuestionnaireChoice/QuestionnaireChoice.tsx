import { Show, splitProps } from "solid-js";
import { Check } from "lucide-solid";
import { clsx } from "~/utils";
import { useQuestionnaireItemContext } from "../questionnaire.context";
import { useQuestionnaireChoice } from "./useQuestionnaireChoice";
import type { QuestionnaireChoiceProps } from "../questionnaire.types";

const labelClasses =
  "group/questionnaire-choice relative flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 text-start transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[checked]:border-primary/50 data-[checked]:bg-muted/40";

/**
 * 固定选项:label 包住一个视觉隐藏的原生 radio/checkbox(保留原生语义与键盘行为),
 * 再叠加自绘指示器、文字与快捷键。
 */
export function QuestionnaireChoice(props: QuestionnaireChoiceProps) {
  const item = useQuestionnaireItemContext("QuestionnaireChoice");
  const [local, rest] = splitProps(props, [
    "value",
    "checked",
    "defaultChecked",
    "disabled",
    "onChange",
    "class",
    "classList",
    "children",
  ]);

  const choice = useQuestionnaireChoice({
    value: local.value,
    checked: () => local.checked,
    defaultChecked: () => local.defaultChecked ?? false,
    disabled: () => !!local.disabled,
    onChange: (event) => local.onChange?.(event),
  });

  const checked = () => choice.checkedResolved();

  return (
    <label
      {...rest}
      data-slot="questionnaire-choice"
      data-checked={checked() ? "" : undefined}
      data-unchecked={checked() ? undefined : ""}
      data-disabled={choice.isDisabled() ? "" : undefined}
      data-invalid={item.invalid() ? "" : undefined}
      data-type={choice.type()}
      data-shortcut={choice.shortcut() ?? undefined}
      class={clsx(labelClasses, local.class)}
      classList={local.classList}
    >
      <input
        {...choice.inputProps()}
        ref={choice.setInput}
        data-slot="questionnaire-choice-input"
        class="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        data-slot="questionnaire-choice-indicator"
        class={clsx(
          "pointer-events-none relative mt-0.5 flex size-4 shrink-0 items-center justify-center border",
          choice.type() === "radio" ? "rounded-full" : "rounded-[4px]",
          checked() && "border-primary",
        )}
      >
        <Show when={checked()}>
          <Show
            when={choice.type() === "checkbox"}
            fallback={
              <span
                class="size-2 rounded-full bg-primary"
                data-slot="questionnaire-choice-indicator-dot"
              />
            }
          >
            <Check class="size-3 text-primary" />
          </Show>
        </Show>
      </span>
      <span
        data-slot="questionnaire-choice-label"
        class="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug"
      >
        {local.children}
      </span>
      <Show when={choice.shortcut()}>
        {(shortcut) => (
          <span
            aria-hidden="true"
            data-slot="questionnaire-choice-shortcut"
            class="pointer-events-none ms-auto shrink-0 text-xs text-muted-foreground"
          >
            {shortcut()}
          </span>
        )}
      </Show>
    </label>
  );
}
