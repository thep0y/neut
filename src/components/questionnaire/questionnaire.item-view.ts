import { createMemo, type Accessor } from "solid-js";
import type { QuestionnaireItemHandle } from "./questionnaire.context";
import type { QuestionnaireItemDefinition } from "./questionnaire.types";
import { compareDocumentOrder } from "./questionnaire.utils";

export interface ItemViewOptions {
  /** 已注册的题目句柄（注册顺序） */
  registered: Accessor<QuestionnaireItemHandle[]>;
  /** DOM 结构版本号：子节点换位后据此重排 */
  domVersion: Accessor<number>;
  /** 受控的激活项名字（undefined 表示非受控） */
  controlledItem: Accessor<string | undefined>;
  /** 非受控模式下内部记录的激活项名字 */
  internalName: Accessor<string | null>;
  /** 声明式题目定义（用于快捷键与校验元数据） */
  definitions: Accessor<readonly QuestionnaireItemDefinition[] | undefined>;
}

export interface ItemView {
  /** 按 DOM 顺序排列的全部题目 */
  ordered: Accessor<QuestionnaireItemHandle[]>;
  /** 可参与导航的题目（排除 disabled） */
  enabled: Accessor<QuestionnaireItemHandle[]>;
  /** 当前激活题目的名字 */
  activeName: Accessor<string | null>;
  /** 当前激活题目（不在可用列表时为 null） */
  activeItem: Accessor<QuestionnaireItemHandle | null>;
  /** 可用题目数、激活项下标（-1 表示不在列表里） */
  total: Accessor<number>;
  index: Accessor<number>;
  /** 面向用户的进度：从 1 开始，没有激活项时为 0 */
  current: Accessor<number>;
  first: Accessor<boolean>;
  last: Accessor<boolean>;
  /** 题目定义按名字建索引；未提供定义时为 null */
  itemDefinitions: Accessor<Map<string, QuestionnaireItemDefinition> | null>;
}

/**
 * 题目视图：把"注册表 + DOM 版本 + 当前项"推导成导航需要的派生状态。
 *
 * 单一职责：只做派生计算（排序、过滤、定位、进度、定义索引），
 * 不改变任何状态——所以它可以在不触发导航的前提下被单独断言。
 */
export function createItemView(options: ItemViewOptions): ItemView {
  const ordered = createMemo(() => {
    options.domVersion();
    return [...options.registered()].sort((a, b) =>
      compareDocumentOrder(a.element, b.element),
    );
  });

  const enabled = createMemo(() =>
    ordered().filter((item) => !item.disabled()),
  );

  const activeName = createMemo(
    () => options.controlledItem() ?? options.internalName(),
  );

  const activeItem = createMemo(
    () => enabled().find((item) => item.name === activeName()) ?? null,
  );

  const total = createMemo(() => enabled().length);

  const index = createMemo(() =>
    enabled().findIndex((item) => item.name === activeName()),
  );

  const current = createMemo(() => (index() < 0 ? 0 : index() + 1));

  const itemDefinitions = createMemo(() => {
    const list = options.definitions();
    if (!list) return null;
    return new Map(list.map((definition) => [definition.name, definition]));
  });

  return {
    ordered,
    enabled,
    activeName,
    activeItem,
    total,
    index,
    current,
    first: createMemo(() => total() > 0 && index() === 0),
    last: createMemo(() => total() > 0 && index() === total() - 1),
    itemDefinitions,
  };
}

/**
 * 该激活哪个题目：优先受控值与 `defaultItem`，两者都不在可用列表里时退到第一个。
 * 纯函数——列表与候选值都由调用方给出。
 */
export function resolveActiveName(options: {
  enabled: readonly QuestionnaireItemHandle[];
  controlledItem: string | undefined;
  defaultItem: string | undefined;
}): string | null {
  const { enabled, controlledItem, defaultItem } = options;
  const candidate = controlledItem ?? defaultItem;
  if (candidate && enabled.some((entry) => entry.name === candidate)) {
    return candidate;
  }
  return enabled[0]?.name ?? null;
}
