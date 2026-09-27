import { createEffect, mergeProps, onCleanup, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { QuestionnaireItemContext } from "../questionnaire.context";
import { useQuestionnaireItem } from "../useQuestionnaireItem";
import type { QuestionnaireItemStatus } from "../questionnaire.types";
import type { QuestionnaireItemProps } from "../questionnaire.types";

/** 单个题目:fieldset,非激活时 hidden + inert,并向 Root 注册命令式句柄 */
export function QuestionnaireItem(props: QuestionnaireItemProps) {
  const merged = mergeProps(
    { required: false, multiple: false, disabled: false, invalid: false },
    props,
  );
  const [local, rest] = splitProps(merged, [
    "name",
    "required",
    "multiple",
    "disabled",
    "invalid",
    "onStatusChange",
    "class",
    "classList",
    "children",
  ]);

  const engine = useQuestionnaireItem({
    name: local.name,
    required: () => local.required,
    multiple: () => local.multiple,
    disabled: () => local.disabled,
    invalid: () => local.invalid,
    onStatusChange: (status) => local.onStatusChange?.(status),
  });

  let lastStatus: QuestionnaireItemStatus | undefined;
  createEffect(() => {
    const status = engine.context.status();
    if (lastStatus !== undefined && lastStatus !== status) {
      local.onStatusChange?.(status);
    }
    lastStatus = status;
  });

  return (
    <QuestionnaireItemContext.Provider value={engine.context}>
      <fieldset
        {...rest}
        ref={(el) => {
          onCleanup(engine.registerElement(el));
        }}
        disabled={engine.context.disabled()}
        hidden={!engine.context.active()}
        inert={!engine.context.active()}
        tabIndex={-1}
        aria-describedby={engine.describedBy()}
        aria-invalid={engine.context.invalid() || undefined}
        aria-keyshortcuts={engine.keyshortcuts()}
        data-slot="questionnaire-item"
        data-active={engine.context.active() ? "" : undefined}
        data-status={engine.context.status()}
        data-invalid={engine.context.invalid() ? "" : undefined}
        data-disabled={engine.context.disabled() ? "" : undefined}
        class={clsx("min-w-0 border-0 p-0 outline-none", local.class)}
        classList={local.classList}
      >
        {local.children}
      </fieldset>
    </QuestionnaireItemContext.Provider>
  );
}
