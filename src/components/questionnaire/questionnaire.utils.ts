import type { QuestionnaireShortcutMode } from "./questionnaire.types";

/** 字符串/数组是否含有非空白内容(与上游 ce 一致) */
export function hasText(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => String(item).trim().length > 0);
  }
  return value != null && String(value).trim().length > 0;
}

/** 按模式生成快捷键字母表:letters = A..Z,numbers = 1..9 */
export function shortcutAlphabet(
  mode: QuestionnaireShortcutMode | null,
): string[] {
  if (mode === "letters") {
    return Array.from({ length: 26 }, (_, index) =>
      String.fromCharCode(65 + index),
    );
  }
  if (mode === "numbers") {
    return Array.from({ length: 9 }, (_, index) => String(index + 1));
  }
  return [];
}

/** 把按下的键规范成快捷键(字母大小写无关),不匹配返回 null */
export function normalizeShortcut(
  key: string,
  mode: QuestionnaireShortcutMode | null,
): string | null {
  const normalized = mode === "letters" ? key.toUpperCase() : key;
  return shortcutAlphabet(mode).includes(normalized) ? normalized : null;
}

/** 拼 aria-keyshortcuts:有启用状态时额外附上 Enter */
export function keyShortcutText(
  shortcut: string | null,
  enterEnabled: boolean,
): string | undefined {
  return (
    [shortcut, enterEnabled ? "Enter" : null].filter(Boolean).join(" ") ||
    undefined
  );
}

/** 判断答案控件当前是否有值(choice 看 checked,input 看 name+value) */
export function isAnswerFilled(entry: {
  type: "choice" | "input";
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
}): boolean {
  if (entry.type === "choice") {
    return (entry.element as HTMLInputElement).checked;
  }
  return entry.element.hasAttribute("name") && hasText(entry.element.value);
}

/** 文本类输入框为空(用于原生校验) */
export function isTextInputEmpty(entry: {
  type: "choice" | "input";
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
}): boolean {
  return (
    entry.type === "input" &&
    ["email", "password", "search", "tel", "text", "url"].includes(
      entry.element.type,
    ) &&
    !hasText(entry.element.value)
  );
}

/** 是否为可输入文本的控件(用于决定方向键是否应当导航而非移动焦点) */
export function isTypingElement(element: EventTarget | null): boolean {
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLSelectElement) return true;
  if (element instanceof HTMLInputElement) {
    return !["button", "checkbox", "radio", "reset", "submit"].includes(
      element.type,
    );
  }
  return element instanceof HTMLElement && element.isContentEditable;
}

export function isNativeRadio(element: EventTarget | null): boolean {
  return element instanceof HTMLInputElement && element.type === "radio";
}

/** 按文档顺序比较两个元素 */
export function compareDocumentOrder(a: Element, b: Element): number {
  if (a === b) return 0;
  const position = a.compareDocumentPosition(b);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}
