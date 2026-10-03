import { createMemo, createSignal, type Accessor } from "solid-js";
import type { QuestionnaireAnswerEntry } from "./questionnaire.context";
import type { QuestionnaireItemStatus } from "./questionnaire.types";
import { isAnswerDisabled } from "./questionnaire.utils";

export interface AnswerBookkeepingOptions {
  /** 多选：选中集合可以有多项 */
  multiple: Accessor<boolean>;
  /** 必填：必填题不允许跳过 */
  required: Accessor<boolean>;
}

export interface AnswerBookkeeping {
  answers: Accessor<QuestionnaireAnswerEntry[]>;
  selections: Accessor<string[]>;
  defaults: Accessor<string[]>;
  touched: Accessor<boolean>;
  /** 每次 reset 自增，供子组件强制同步 DOM */
  resetVersion: Accessor<number>;
  status: Accessor<QuestionnaireItemStatus>;
  /** 已跳过：状态为 skipped 且不是必填 */
  skippable: Accessor<boolean>;
  answeredOk: Accessor<boolean>;
  hasInputAnswer: Accessor<boolean>;

  registerAnswerControl: (entry: QuestionnaireAnswerEntry) => () => void;
  registerAnswerSelection: (id: string, initialSelected: boolean) => () => void;
  setAnswerDefault: (id: string, selected: boolean) => void;
  setAnswerSelectionFromInteraction: (id: string, selected: boolean) => void;
  syncControlledAnswerSelection: (id: string, selected: boolean) => void;
  getAnswerByElement: (target: Element) => QuestionnaireAnswerEntry | null;

  /** 标记已交互（首次校验失败后才显示错误） */
  markTouched: () => void;
  /** 跳过本题目；必填时返回 false 且不改变状态 */
  skip: () => boolean;
  /** 回到默认选择并把 touched/skipped 复位 */
  reset: () => void;
}

/**
 * 单个题目的答案账目：注册了哪些答案控件、选中的是哪些、默认值是什么、
 * 是否被跳过/触碰，以及由这些推导出的作答状态。
 *
 * 单一职责：只维护这份账目与它的读写方法，不碰 DOM 焦点、不拼 ARIA 文本、
 * 不决定校验结果——那些是 item 层的事。
 */
export function createAnswerBookkeeping(
  options: AnswerBookkeepingOptions,
): AnswerBookkeeping {
  const [answers, setAnswers] = createSignal<QuestionnaireAnswerEntry[]>([]);
  const [selections, setSelections] = createSignal<string[]>([]);
  const [defaults, setDefaults] = createSignal<string[]>([]);
  const [skipped, setSkipped] = createSignal(false);
  const [touched, setTouched] = createSignal(false);
  const [resetVersion, setResetVersion] = createSignal(0);

  const applySelection = (id: string, selected: boolean) => {
    setSelections((prev) => {
      if (!selected) return prev.filter((value) => value !== id);
      if (!options.multiple()) return [id];
      return prev.includes(id) ? prev : [...prev, id];
    });
  };

  const hasInputAnswer = createMemo(() =>
    answers().some(
      (entry) =>
        entry.type === "input" &&
        !["button", "checkbox", "radio", "reset", "submit"].includes(
          entry.element.type,
        ),
    ),
  );

  const status = createMemo<QuestionnaireItemStatus>(() => {
    if (skipped()) return "skipped";
    const selected = selections();
    const answered = answers().some(
      (entry) => selected.includes(entry.id) && !isAnswerDisabled(entry),
    );
    return answered ? "answered" : "unanswered";
  });

  return {
    answers,
    selections,
    defaults,
    touched,
    resetVersion,
    status,
    hasInputAnswer,
    skippable: createMemo(() => status() === "skipped" && !options.required()),
    answeredOk: createMemo(() => status() === "answered"),

    registerAnswerControl(entry) {
      setAnswers((prev) => [
        ...prev.filter(
          (item) => item.id !== entry.id && item.element !== entry.element,
        ),
        entry,
      ]);
      return () => setAnswers((prev) => prev.filter((item) => item !== entry));
    },

    registerAnswerSelection(id, initialSelected) {
      if (initialSelected) {
        setSelections((prev) => {
          if (!options.multiple()) return prev.length ? prev : [id];
          return prev.includes(id) ? prev : [...prev, id];
        });
      }
      return () => {
        setSelections((prev) => prev.filter((value) => value !== id));
        setDefaults((prev) => prev.filter((value) => value !== id));
      };
    },

    setAnswerDefault(id, selected) {
      setDefaults((prev) => {
        if (!selected) return prev.filter((value) => value !== id);
        return prev.includes(id) ? prev : [...prev, id];
      });
    },

    setAnswerSelectionFromInteraction(id, selected) {
      // 用户重新作答即视为取消"跳过"
      setSkipped(false);
      applySelection(id, selected);
    },

    syncControlledAnswerSelection(id, selected) {
      applySelection(id, selected);
    },

    getAnswerByElement(target) {
      return answers().find((entry) => entry.element === target) ?? null;
    },

    markTouched() {
      setTouched(true);
    },

    skip() {
      if (options.required()) return false;
      setSelections([]);
      setSkipped(true);
      return true;
    },

    reset() {
      setTouched(false);
      setSkipped(false);
      setSelections(
        options.multiple() ? [...defaults()] : defaults().slice(0, 1),
      );
      setResetVersion((value) => value + 1);
    },
  };
}
