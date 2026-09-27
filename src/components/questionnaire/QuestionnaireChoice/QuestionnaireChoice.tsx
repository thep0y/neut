import { Show, splitProps } from "solid-js";
import { Check } from "lucide-solid";
import { clsx } from "~/utils";
import { useQuestionnaireItemContext } from "../questionnaire.context";
import { useQuestionnaireChoice } from "./useQuestionnaireChoice";
import type { QuestionnaireChoiceProps } from "../questionnaire.types";

// 类名来自 shadcn base/nova 的 cn-questionnaire-choice 等 token(见 style-nova.css)
const labelClasses =
  "group/questionnaire-choice relative flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-start transition-colors outline-none select-none hover:bg-muted/50 data-[checked]:border-primary/40 data-[checked]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[invalid]:border-destructive has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 dark:bg-input/20 dark:data-[checked]:bg-muted";

const shortcutClasses =
  "pointer-events-none ms-auto inline-flex size-5 shrink-0 translate-y-[calc(var(--spacing)*0.45)] items-center justify-center rounded-md border border-input bg-background font-mono text-[0.625rem] leading-none font-medium text-muted-foreground";

/** 固定选项:原生 radio/checkbox(视觉隐藏) + 自绘指示器 + 文字 + 快捷键徽标 */
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
        ref={choice.setInput}
        id={choice.id}
        type={choice.type()}
        name={choice.name()}
        value={local.value}
        checked={checked()}
        disabled={choice.isDisabled()}
        required={choice.required()}
        aria-invalid={item.invalid() || undefined}
        aria-keyshortcuts={choice.ariaKeyShortcuts()}
        onChange={choice.handleChange}
        data-slot="questionnaire-choice-input"
        class="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        data-slot="questionnaire-choice-indicator"
        class={clsx(
          "pointer-events-none relative flex size-4 shrink-0 translate-y-[calc(var(--spacing)*0.45)] items-center justify-center border group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5",
          choice.type() === "radio" ? "rounded-full" : "rounded-[4px]",
          checked()
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input dark:bg-input/30",
        )}
      >
        <Show when={checked()}>
          <Show
            when={choice.type() === "checkbox"}
            fallback={
              <span
                data-slot="questionnaire-choice-indicator-dot"
                class="size-2 rounded-full bg-primary-foreground"
              />
            }
          >
            <Check class="size-3.5" />
          </Show>
        </Show>
      </span>
      <span
        data-slot="questionnaire-choice-content"
        class="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug"
      >
        {local.children}
      </span>
      <Show when={choice.shortcut()}>
        {(shortcut) => (
          <span
            aria-hidden="true"
            data-slot="questionnaire-shortcut"
            class={shortcutClasses}
          >
            {shortcut()}
          </span>
        )}
      </Show>
    </label>
  );
}
