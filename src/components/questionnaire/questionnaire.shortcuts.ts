import type { QuestionnaireAnswerEntry } from "./questionnaire.context";
import type {
  QuestionnaireItemDefinition,
  QuestionnaireShortcutMode,
} from "./questionnaire.types";
import { shortcutAlphabet } from "./questionnaire.utils";

/**
 * 题目的快捷键推导。
 *
 * 单一职责：把"定义里的 choices / 已注册的答案 / 快捷键模式"换算成
 * `值或 id → 字母` 的映射，以及反向查找。全部是纯函数——
 * 不读信号、不碰 DOM，因此三种来源的组合都能单独断言。
 *
 * 两套映射互斥：
 * - 定义里声明了 choices 时按 **choice.value** 分配字母（与选项顺序一致，
 *   跳过 disabled，字母用尽即停）；
 * - 否则按 **answer.id** 给已注册的 choice 类型答案依次分配。
 */

/** 声明式选项的映射；没有 shortcuts 模式或定义里没有 choices 时返回 null */
export function buildShortcutByChoiceValue(
  definition: QuestionnaireItemDefinition | undefined,
  mode: QuestionnaireShortcutMode | null,
): Map<string, string> | null {
  if (!mode || !definition?.choices) return null;

  const alphabet = shortcutAlphabet(mode);
  const map = new Map<string, string>();
  let cursor = 0;
  for (const choice of definition.choices) {
    if (choice.disabled) continue;
    const letter = alphabet[cursor];
    if (!letter) break;
    map.set(choice.value, letter);
    cursor += 1;
  }
  return map;
}

/** 已注册答案的映射；已有声明式映射时返回空表（两套不并用） */
export function buildShortcutByAnswerId(
  answers: readonly QuestionnaireAnswerEntry[],
  hasChoiceValueMap: boolean,
  mode: QuestionnaireShortcutMode | null,
): Map<string, string> {
  if (hasChoiceValueMap) return new Map();

  const alphabet = shortcutAlphabet(mode);
  const choices = answers.filter((entry) => entry.type === "choice");
  return new Map(
    choices
      .slice(0, alphabet.length)
      .map((entry, index) => [entry.id, alphabet[index]!]),
  );
}

/** 按字母反查答案：优先走声明式映射（比对 value），否则走 id 映射 */
export function findAnswerByShortcut(
  shortcut: string,
  maps: {
    byChoiceValue: Map<string, string> | null;
    byAnswerId: Map<string, string>;
    answers: readonly QuestionnaireAnswerEntry[];
  },
): QuestionnaireAnswerEntry | null {
  const { byChoiceValue, byAnswerId, answers } = maps;

  if (byChoiceValue) {
    const value = [...byChoiceValue.entries()].find(
      ([, letter]) => letter === shortcut,
    )?.[0];
    return (
      answers.find(
        (entry) => entry.type === "choice" && entry.value === value,
      ) ?? null
    );
  }

  const id = [...byAnswerId.entries()].find(
    ([, letter]) => letter === shortcut,
  )?.[0];
  return answers.find((entry) => entry.id === id) ?? null;
}
