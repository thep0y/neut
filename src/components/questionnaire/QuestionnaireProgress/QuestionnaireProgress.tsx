import { splitProps, type JSX } from "solid-js";
import { clsx } from "~/utils";
import { useQuestionnaireRootContext } from "../questionnaire.context";
import type {
  QuestionnaireProgressProps,
  QuestionnaireRootState,
} from "../questionnaire.types";

/** 进度(默认显示 "Question X of Y");children 传函数可拿到 render state 自绘 */
export function QuestionnaireProgress(props: QuestionnaireProgressProps) {
  const root = useQuestionnaireRootContext("QuestionnaireProgress");
  const [local, rest] = splitProps(props, ["class", "classList", "children"]);
  const state = root.state;
  const label = () => {
    const value = state();
    return value.total
      ? `Question ${value.current} of ${value.total}`
      : undefined;
  };

  return (
    <div
      {...rest}
      data-slot="questionnaire-progress"
      role="progressbar"
      aria-label="Questionnaire progress"
      aria-live="polite"
      aria-valuemax={state().total || undefined}
      aria-valuemin={state().total ? 1 : undefined}
      aria-valuenow={state().total ? state().current : undefined}
      aria-valuetext={label()}
      data-current={state().current}
      data-total={state().total}
      data-first={state().first ? "" : undefined}
      data-last={state().last ? "" : undefined}
      class={clsx(
        "min-h-[1lh] w-fit min-w-[14ch] font-medium text-xs text-muted-foreground tabular-nums",
        local.class,
      )}
      classList={local.classList}
    >
      {typeof local.children === "function"
        ? (local.children as (state: QuestionnaireRootState) => JSX.Element)(
            state(),
          )
        : (local.children ?? label())}
    </div>
  );
}
