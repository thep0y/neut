import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useQuestionnaireItemContext } from "../questionnaire.context";
import type { QuestionnaireChoicesProps } from "../questionnaire.types";

/** 选项容器:grid 布局,携带当前快捷键模式供子项使用 */
export function QuestionnaireChoices(props: QuestionnaireChoicesProps) {
  const item = useQuestionnaireItemContext("QuestionnaireChoices");
  const [local, rest] = splitProps(props, ["class", "classList"]);
  return (
    <div
      {...rest}
      data-slot="questionnaire-choices"
      data-shortcuts={item.shortcuts() ?? undefined}
      class={clsx("grid min-w-0 gap-2", local.class)}
      classList={local.classList}
    />
  );
}
