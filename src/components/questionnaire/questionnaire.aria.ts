import { createSignal, type Accessor } from "solid-js";
import type { QuestionnaireItemStatus } from "./questionnaire.types";

/**
 * 题目 ARIA 文本的组装与 id 登记。
 *
 * 单一职责：只负责"对外描述文字"——`aria-describedby` 的 id 合并、
 * `aria-keyshortcuts` 的按键列表。不持有作答状态，也不决定对错：
 * 是否无效、是否首尾题都由调用方以布尔量传入。
 */

export interface IdRegistry {
  ids: Accessor<string[]>;
  /** 登记一个 id（重复登记不会加两次），返回注销函数 */
  register: (id: string) => () => void;
}

/** 生成 id 集合并提供登记/注销：描述与错误的多个来源各自登记，读取时合并 */
export function createIdRegistry(): IdRegistry {
  const [ids, setIds] = createSignal<string[]>([]);

  return {
    ids,
    register(id) {
      setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return () => setIds((prev) => prev.filter((value) => value !== id));
    },
  };
}

/**
 * `aria-describedby`：描述 id 常驻，只有**当前无效**时才附上错误 id，
 * 去重后以空格连接；没有任何 id 时返回 undefined（不输出空属性）。
 */
export function buildDescribedBy(
  descriptionIds: readonly string[],
  errorIds: readonly string[],
  invalid: boolean,
): string | undefined {
  const ids = [...descriptionIds, ...(invalid ? errorIds : [])];
  return [...new Set(ids)].join(" ") || undefined;
}

/**
 * `aria-keyshortcuts`：只在题目处于激活态时给出（键盘操作只作用于当前题）。
 * - 始终可提交（Mod+Enter）；
 * - 有答案控件时上下箭头可在答案间移动；
 * - 非首题才提示上一题；非末题且已作答才提示下一题（未作答时右箭头不前进）。
 */
export function buildItemKeyshortcuts(input: {
  active: boolean;
  hasAnswers: boolean;
  first: boolean;
  last: boolean;
  status: QuestionnaireItemStatus;
}): string | undefined {
  const { active, hasAnswers, first, last, status } = input;
  if (!active) return undefined;

  // 第一项是常量，拼接结果不可能为空串，因此不需要 `|| undefined` 兜底
  return [
    "Meta+Enter Control+Enter",
    hasAnswers ? "ArrowUp ArrowDown" : null,
    !first ? "ArrowLeft" : null,
    !last && status !== "unanswered" ? "ArrowRight" : null,
  ]
    .filter(Boolean)
    .join(" ");
}
