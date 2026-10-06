import { render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { Questionnaire } from "~/components/questionnaire/Questionnaire";
import { QuestionnaireItem } from "~/components/questionnaire/QuestionnaireItem";

/**
 * Questionnaire 测试的共享脚手架。
 *
 * 这里**不需要**再手动触发 DOM 变更来纠正题目顺序了：`compareDocumentOrder`
 * 对尚未连入文档的节点返回 0，排序回退到注册顺序；`createDomVersionWatcher`
 * 会在挂载时自增一次版本号，节点连上文档后再按真实 DOM 顺序收敛一次。
 */

/** 让 Solid 的 effect / queueMicrotask 落地 */
export async function flush(rounds = 2): Promise<void> {
  for (let index = 0; index < rounds; index += 1) {
    await Promise.resolve();
  }
}

export async function renderWithItems(
  itemNames: readonly string[],
  children: JSX.Element,
  questionnaireProps: {
    defaultItem?: string;
    shortcuts?: "letters" | "numbers";
    item?: string;
    onItemChange?: (item: string) => void;
  } = {},
) {
  const result = render(() => (
    <Questionnaire
      defaultItem={questionnaireProps.defaultItem}
      item={questionnaireProps.item}
      shortcuts={questionnaireProps.shortcuts}
      onItemChange={questionnaireProps.onItemChange}
    >
      {children}
      {itemNames.map((name) => (
        <QuestionnaireItem name={name} />
      ))}
    </Questionnaire>
  ));
  await flush();
  return result;
}
