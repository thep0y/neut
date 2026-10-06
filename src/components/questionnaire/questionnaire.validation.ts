import type { QuestionnaireAnswerEntry } from "./questionnaire.context";
import type { QuestionnaireItemStatus } from "./questionnaire.types";
import { isAnswerFilled } from "./questionnaire.utils";

/**
 * 题目校验的判定。
 *
 * 单一职责：回答"这一题现在算不算无效""它是否满足要求""哪个原生控件先报错"。
 * 全部是纯函数——焦点与 `reportValidity` 这类副作用留给调用方，
 * 因此每条分支都能脱离 DOM 单独断言。
 */

/**
 * 是否展示错误态：
 * - 禁用的题目永远不报错；
 * - 已跳过的题目不报错；
 * - 显式传入的 `invalid` 优先（受控）；
 * - 否则只在**用户交互过**之后才报错，且满足要求时不报错。
 *
 * 注：进入这里时 `skippable` 必为 false（上面的条件已排除），
 * 表达式里的 `skippable` 是迁移前就有的冗余分支，保留以维持原语义。
 */
export function resolveItemInvalid(input: {
  disabled: boolean;
  invalid: boolean;
  skippable: boolean;
  touched: boolean;
  answeredOk: boolean;
}): boolean {
  const { disabled, invalid, skippable, touched, answeredOk } = input;
  if (disabled || skippable) return false;
  if (invalid) return true;
  return touched && !(skippable || (!invalid && answeredOk));
}

/**
 * 是否满足要求：
 * - 禁用视为满足；
 * - 已跳过且非必填视为满足；
 * - 否则必须已作答且没有外部传入的 invalid。
 */
export function isItemSatisfied(input: {
  disabled: boolean;
  status: QuestionnaireItemStatus;
  required: boolean;
  invalid: boolean;
}): boolean {
  const { disabled, status, required, invalid } = input;
  if (disabled) return true;
  if (status === "skipped" && !required) return true;
  return !invalid && status === "answered";
}

/**
 * 找出第一个"有值且原生校验不通过"的答案控件。
 * 只有它参与原生报错——空控件交给自定义校验，避免必填项的浏览器气泡到处弹。
 */
export function findNativeInvalidAnswer(
  answers: readonly QuestionnaireAnswerEntry[],
): QuestionnaireAnswerEntry | undefined {
  return answers.find(
    (entry) =>
      isAnswerFilled(entry) &&
      entry.element.willValidate &&
      !entry.element.validity.valid,
  );
}
