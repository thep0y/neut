import {
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  type ValidComponent,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { clsx } from "~/utils";
import { useQuestionnaireItemContext } from "../questionnaire.context";
import type { QuestionnaireErrorProps } from "../questionnaire.types";

/** 校验错误提示(p);invalid 时显示并挂 role="alert",id 注册给 Item */
export function QuestionnaireError<T extends ValidComponent = "p">(
  props: QuestionnaireErrorProps<T>,
) {
  const item = useQuestionnaireItemContext("QuestionnaireError");
  const [local, rest] = splitProps(props, [
    "id",
    "class",
    "classList",
    "component",
    "children",
  ]);
  const id = local.id ?? createUniqueId();
  onMount(() => onCleanup(item.registerError(id)));

  return (
    <Dynamic
      {...rest}
      component={(local.component as ValidComponent) ?? "p"}
      id={id}
      role={item.invalid() ? "alert" : undefined}
      hidden={!item.invalid()}
      data-slot="questionnaire-error"
      data-invalid={item.invalid() ? "" : undefined}
      class={clsx("mt-2 text-sm text-destructive", local.class)}
      classList={local.classList}
    >
      {local.children ??
        (item.required()
          ? "Choose an answer to continue."
          : "Choose an answer or skip this question.")}
    </Dynamic>
  );
}
