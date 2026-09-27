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
import type { QuestionnaireDescriptionProps } from "../questionnaire.types";

/** 题目描述(p);id 注册给 Item,用于 fieldset 的 aria-describedby */
export function QuestionnaireDescription<T extends ValidComponent = "p">(
  props: QuestionnaireDescriptionProps<T>,
) {
  const item = useQuestionnaireItemContext("QuestionnaireDescription");
  const [local, rest] = splitProps(props, [
    "id",
    "class",
    "classList",
    "component",
  ]);
  const id = local.id ?? createUniqueId();
  onMount(() => onCleanup(item.registerDescription(id)));

  return (
    <Dynamic
      {...rest}
      component={(local.component as ValidComponent) ?? "p"}
      id={id}
      data-slot="questionnaire-description"
      class={clsx(
        "mt-1 text-sm text-muted-foreground text-pretty",
        local.class,
      )}
      classList={local.classList}
    />
  );
}
