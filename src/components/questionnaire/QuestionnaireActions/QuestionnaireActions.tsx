import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import type { QuestionnaireChoicesProps } from "../questionnaire.types";

/** 底部操作区:Previous 左对齐,Skip/Next/Submit 右对齐 */
export function QuestionnaireActions(props: QuestionnaireChoicesProps) {
  const [local, rest] = splitProps(props, ["class", "classList"]);
  return (
    <div
      {...rest}
      data-slot="questionnaire-actions"
      class={clsx(
        "grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:min-h-8",
        local.class,
      )}
      classList={local.classList}
    />
  );
}
