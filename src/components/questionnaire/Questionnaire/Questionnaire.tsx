import { createSignal, mergeProps, onCleanup, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { QuestionnaireRootContext } from "../questionnaire.context";
import { useQuestionnaireRoot } from "../useQuestionnaireRoot";
import type { QuestionnaireProps } from "../questionnaire.types";

/** Questionnaire 根:渲染 form,持有进度、激活项、校验与导航状态 */
export function Questionnaire(props: QuestionnaireProps) {
  const merged = mergeProps({ noValidate: true }, props);
  const [local, rest] = splitProps(merged, [
    "class",
    "classList",
    "children",
    "defaultItem",
    "item",
    "items",
    "onItemChange",
    "shortcuts",
    "noValidate",
    "onReset",
    "onSubmit",
  ]);

  const [form, setForm] = createSignal<HTMLFormElement>();
  const { context, formProps } = useQuestionnaireRoot({
    item: () => local.item,
    defaultItem: () => local.defaultItem,
    items: () => local.items,
    shortcuts: () => local.shortcuts,
    noValidate: () => local.noValidate,
    onItemChange: (item) => local.onItemChange?.(item),
    onReset: (event) => local.onReset?.(event),
    onSubmit: (event) => local.onSubmit?.(event),
    formRef: form,
  });

  return (
    <QuestionnaireRootContext.Provider value={context}>
      <form
        {...rest}
        ref={(el) => {
          setForm(el);
          onCleanup(() => setForm(undefined));
        }}
        noValidate={local.noValidate}
        data-slot="questionnaire"
        data-shortcuts={formProps["data-shortcuts"]}
        onKeyDown={formProps.onKeyDown}
        onSubmit={formProps.onSubmit}
        onReset={formProps.onReset}
        class={clsx("flex w-full min-w-0 flex-col gap-4", local.class)}
        classList={local.classList}
      >
        {local.children}
      </form>
    </QuestionnaireRootContext.Provider>
  );
}
