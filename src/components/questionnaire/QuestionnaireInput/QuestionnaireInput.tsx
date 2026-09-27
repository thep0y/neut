import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useQuestionnaireInput } from "./useQuestionnaireInput";
import type { QuestionnaireInputProps } from "../questionnaire.types";

const inputClasses =
  "min-h-14 w-full min-w-0 rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition-[color,box-shadow,background-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

/** 自由作答输入(需有可见 label、aria-label 或 aria-labelledby 提供可访问名称) */
export function QuestionnaireInput(props: QuestionnaireInputProps) {
  const [local, rest] = splitProps(props, [
    "type",
    "defaultValue",
    "value",
    "disabled",
    "onChange",
    "class",
    "classList",
  ]);

  const engine = useQuestionnaireInput({
    type: () => local.type ?? "text",
    defaultValue: () => local.defaultValue,
    value: () => local.value,
    disabled: () => local.disabled,
    onChange: (event) => local.onChange?.(event),
  });

  return (
    <div
      data-slot="questionnaire-input-wrapper"
      class="group/questionnaire-input relative min-w-0"
    >
      <input
        {...rest}
        ref={(el) => {
          engine.setInput(el);
          // 非受控时把 defaultValue 写入 DOM(Solid 的 input 没有 defaultValue 绑定)
          if (!engine.controlled() && local.defaultValue !== undefined) {
            el.defaultValue = local.defaultValue;
          }
        }}
        id={engine.id}
        type={local.type ?? "text"}
        name={engine.name()}
        form={engine.formValue()}
        value={engine.controlled() ? local.value : undefined}
        disabled={engine.isDisabled()}
        aria-invalid={engine.invalid() || undefined}
        aria-keyshortcuts={engine.ariaKeyShortcuts()}
        onChange={(event) => engine.inputProps().onChange(event)}
        data-slot="questionnaire-input"
        data-filled={engine.filled() ? "" : undefined}
        data-empty={engine.filled() ? undefined : ""}
        data-disabled={engine.isDisabled() ? "" : undefined}
        data-invalid={engine.invalid() ? "" : undefined}
        class={clsx(inputClasses, local.class)}
        classList={local.classList}
      />
    </div>
  );
}
