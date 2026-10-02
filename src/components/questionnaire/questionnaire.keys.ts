import type {
  QuestionnaireAnswerEntry,
  QuestionnaireItemHandle,
} from "./questionnaire.context";
import type {
  QuestionnaireItemStatus,
  QuestionnaireShortcutMode,
} from "./questionnaire.types";
import {
  isAnswerFilled,
  isNativeRadio,
  isTypingElement,
  normalizeShortcut,
} from "./questionnaire.utils";

/** 键盘派发需要的能力（注入即可脱离 Solid 与 DOM 状态单独测试） */
export interface QuestionnaireKeyboardContext {
  /** 当前激活的题目 */
  item: QuestionnaireItemHandle;
  /** 当前题目的作答状态（未作答时 ArrowRight 不前进） */
  status: () => QuestionnaireItemStatus;
  /** 快捷键模式，null 表示关闭 */
  shortcuts: QuestionnaireShortcutMode | null;
  goNext: () => void;
  goPrevious: () => void;
  /** 最后一题提交，否则前进 */
  submitOrNext: () => void;
}

/**
 * 问卷表单的按键映射：一个纯派发器——只把按键翻译成导航动作，
 * 不持有状态（当前题、状态、快捷键模式都由 `ctx` 提供）。
 *
 * 处理顺序（先到先得，命中即 `preventDefault` 并返回）：
 * 1. 输入法组合中 / 已被他人处理 / 事件目标不是元素 → 直接放行；
 * 2. Mod+Enter → 提交或前进（长按不重复触发）；
 * 3. 带 Ctrl/Meta/Alt 的其它组合 → 放行给浏览器；
 * 4. 上下箭头 → 在当前题目的答案间移动焦点（`moveAnswerFocus` 说了算）；
 * 5. 左右箭头 → 切上一题 / 下一题（文本输入与原生 radio 上不切题）；
 * 6. Enter 在已填写的答案控件上 → 提交或前进；
 * 7. 其余情况 → 按快捷键模式匹配答案（letters/numbers），命中则聚焦并点击。
 */
export function handleQuestionnaireKeyDown(
  event: KeyboardEvent,
  ctx: QuestionnaireKeyboardContext,
): void {
  const { item } = ctx;
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.keyCode === 229 ||
    !(event.target instanceof Element)
  ) {
    return;
  }
  const target = event.target;

  if (
    event.key === "Enter" &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey
  ) {
    event.preventDefault();
    if (!event.repeat) ctx.submitOrNext();
    return;
  }
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (
    (event.key === "ArrowUp" || event.key === "ArrowDown") &&
    item.moveAnswerFocus(
      target,
      event.key === "ArrowDown" ? "next" : "previous",
    )
  ) {
    event.preventDefault();
    return;
  }

  if (
    (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
    !isTypingElement(target) &&
    !isNativeRadio(target)
  ) {
    event.preventDefault();
    if (event.repeat) return;
    if (event.key === "ArrowLeft") ctx.goPrevious();
    else if (ctx.status() !== "unanswered") ctx.goNext();
    return;
  }

  if (event.key === "Enter") {
    const answer = item.getAnswerByElement(target);
    if (!answer) return;
    event.preventDefault();
    if (!event.repeat && isAnswerFilled(answer)) ctx.submitOrNext();
    return;
  }

  if (!ctx.shortcuts || isTypingElement(target)) return;
  const shortcut = normalizeShortcut(event.key, ctx.shortcuts);
  const answer: QuestionnaireAnswerEntry | null = shortcut
    ? item.getAnswerByShortcut(shortcut)
    : null;
  if (!answer) return;
  event.preventDefault();
  if (event.repeat) return;
  answer.element.focus();
  if (answer.type === "choice") {
    (answer.element as HTMLInputElement).click();
  }
}
