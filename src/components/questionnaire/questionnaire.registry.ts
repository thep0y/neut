import { createSignal, type Accessor } from "solid-js";
import type { QuestionnaireItemHandle } from "./questionnaire.context";

export interface ItemRegistry {
  /** 已注册的题目句柄（未排序，顺序为注册顺序） */
  items: Accessor<QuestionnaireItemHandle[]>;
  /**
   * 注册一个题目，返回注销函数。
   *
   * 同一个 DOM 元素再次注册时**替换**而不是追加：题目组件在受控 props 变化时
   * 会用同一个 fieldset 重新注册，若追加就会出现两条指向同一元素的记录，
   * 于是"上一题/下一题"会停在原地。
   */
  register: (handle: QuestionnaireItemHandle) => () => void;
}

/**
 * 题目句柄注册表。
 *
 * 单一职责：维护"当前有哪些题目"这一份账目（加入、按元素去重替换、移除）。
 * 不排序、不判可用性、不读答案——那些是消费方的事。
 */
export function createItemRegistry(): ItemRegistry {
  const [items, setItems] = createSignal<QuestionnaireItemHandle[]>([]);

  return {
    items,
    register(handle) {
      setItems((prev) => {
        const exists = prev.some((item) => item.element === handle.element);
        return exists
          ? prev.map((item) =>
              item.element === handle.element ? handle : item,
            )
          : [...prev, handle];
      });
      return () => setItems((prev) => prev.filter((item) => item !== handle));
    },
  };
}
