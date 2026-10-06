import type { QuestionnaireAnswerEntry } from "./questionnaire.context";
import {
  isAnswerDisabled,
  isNativeRadio,
  isTypingElement,
} from "./questionnaire.utils";

/**
 * 题目内的焦点移动。
 *
 * 单一职责：给定题目作用域、当前焦点元素与已注册答案，决定"下一个该聚焦谁"，
 * 并处理随之而来的原生 radio 点击。不持有状态、不读信号，因此可以用真实 DOM
 * 直接驱动每一个分支（无可用目标、目标不在列表内、循环回自身等）。
 */

/** 把焦点放到题目内最合适的元素：优先"已有值"的具名输入，其次任意可编辑控件，最后退到作用域本身 */
export function focusItem(scope: HTMLElement | undefined): void {
  if (!scope) return;
  const filled = scope.querySelector<HTMLElement>(
    "input[data-filled][name]:not(:disabled)",
  );
  const anyInput = scope.querySelector<HTMLElement>(
    "input:not([type=hidden]):not(:disabled), textarea:not(:disabled)",
  );
  (filled ?? anyInput ?? scope).focus();
}

export interface MoveAnswerFocusOptions {
  /** 题目作用域（fieldset） */
  scope: HTMLElement | undefined;
  /** 当前焦点所在元素 */
  target: Element;
  direction: "next" | "previous";
  answers: readonly QuestionnaireAnswerEntry[];
}

/**
 * 在可聚焦答案之间移动焦点：
 * - 跳过禁用与已卸载的答案；
 * - 当前目标是输入类控件时，跳过其它输入类控件（避免在文本框之间乱跳）；
 * - 目标不在列表里但就是作用域本身时，从列表首/尾开始；否则不动；
 * - 环形移动；落到原生 radio 上时顺带点击它（radio 的箭头语义）。
 */
export function moveAnswerFocus(options: MoveAnswerFocusOptions): boolean {
  const { scope, target, direction, answers } = options;

  const focusable = answers.filter(
    (entry) =>
      !isAnswerDisabled(entry) &&
      entry.element.isConnected &&
      !(isTypingElement(target) && entry.type === "input"),
  );
  if (!focusable.length) return false;

  const position = focusable.findIndex((entry) => entry.element === target);
  if (position < 0 && target !== scope) return false;

  const nextIndex =
    position < 0
      ? direction === "next"
        ? 0
        : focusable.length - 1
      : (position + (direction === "next" ? 1 : -1) + focusable.length) %
        focusable.length;

  const next = focusable[nextIndex];
  if (!next || next.element === target) return false;

  next.element.focus();
  if (next.type === "choice" && isNativeRadio(next.element)) {
    (next.element as HTMLInputElement).click();
  }
  return true;
}
