import { splitProps, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { clsx } from "~/utils";
import type { QuestionnaireTitleProps } from "../questionnaire.types";

/** 题目标题(legend);可用 component 换成 CardTitle / DialogTitle 等 */
export function QuestionnaireTitle<T extends ValidComponent = "legend">(
  props: QuestionnaireTitleProps<T>,
) {
  const [local, rest] = splitProps(props, ["class", "classList", "component"]);
  return (
    <Dynamic
      {...rest}
      component={(local.component as ValidComponent) ?? "legend"}
      data-slot="questionnaire-title"
      class={clsx("text-lg font-semibold text-pretty", local.class)}
      classList={local.classList}
    />
  );
}
