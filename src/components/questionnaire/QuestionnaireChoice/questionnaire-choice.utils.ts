import type { QuestionnaireItemStatus } from "../questionnaire.types";

/**
 * 固定选项（radio / checkbox）的纯判定。
 *
 * 单一职责：把"受控值 / 跳过状态 / 选中集合 / 校验上下文"换算成
 * 最终要渲染与写回的布尔值，不读信号、不碰 DOM。
 * 受控与非受控、跳过与未跳过、交互前后的一致性都由这些函数显式表达。
 */

/**
 * 最终是否勾选：
 * - 受控（`checked` 有值）时以它为唯一来源，但"已跳过"的题目一律不勾选；
 * - 非受控时看 Item 的选中集合里有没有自己。
 */
export function resolveChoiceChecked(options: {
  controlled: boolean | undefined;
  status: QuestionnaireItemStatus;
  selectedAnswerIds: readonly string[];
  id: string;
}): boolean {
  const { controlled, status, selectedAnswerIds, id } = options;
  if (controlled !== undefined) {
    return status === "skipped" ? false : controlled;
  }
  return selectedAnswerIds.includes(id);
}

/** 选项是否需要原生 `required`：整题必填、单选、且本题没有文本框作答 */
export function isChoiceRequired(options: {
  required: boolean;
  multiple: boolean;
  hasInputAnswer: boolean;
}): boolean {
  return options.required && !options.multiple && !options.hasInputAnswer;
}

/** 已跳过的题目不提交表单字段值（避免把跳过题目的答案一起提交） */
export function resolveChoiceName(
  status: QuestionnaireItemStatus,
  name: string,
): string | undefined {
  return status === "skipped" ? undefined : name;
}

/**
 * 交互后要不要写回选中集合，以及写成什么值：
 * - 用户回调已经 `preventDefault()` → 什么都不做；
 * - 非受控 → 直接采用原生控件的勾选结果；
 * - 受控且题目"已跳过"、原生结果恰好与受控值相同时 → 补一次写回，
 *   否则 DOM 上的临时勾选会残留（受控方不会再送新值过来）；
 * - 其余受控情况 → 交给受控方，自己不写。
 */
export function decideChoiceSelectionChange(options: {
  canceled: boolean;
  controlled: boolean | undefined;
  status: QuestionnaireItemStatus;
  checked: boolean;
}): boolean | null {
  const { canceled, controlled, status, checked } = options;
  if (canceled) return null;
  if (controlled === undefined) return checked;
  if (status === "skipped" && controlled === checked) return controlled;
  return null;
}

/** 选项的快捷键：优先声明式 value 映射，其次按答案 id 分配，都没有则为 null */
export function resolveChoiceShortcut(options: {
  byChoiceValue: Map<string, string> | null;
  byAnswerId: Map<string, string>;
  value: string;
  id: string;
}): string | null {
  const { byChoiceValue, byAnswerId, value, id } = options;
  return byChoiceValue?.get(value) ?? byAnswerId.get(id) ?? null;
}
