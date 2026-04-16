import { createContext, type ParentProps, useContext } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { ItemEntry } from "./Accordion.types";

interface AccordionContextValue<T> {
  orientation: "horizontal" | "vertical";
  isOpen: (index: number) => boolean;
  toggle: (index: number) => void;
  registerItem: (value?: T) => number;
  unregisterItem: (index: number) => void;
}

// biome-ignore lint/suspicious/noExplicitAny: must be any to support generic types
const AccordionContext = createContext<AccordionContextValue<any>>();

export function AccordionProvider<T>(
  props: ParentProps & {
    orientation: "horizontal" | "vertical";
    defaultValue?: T[];
    value?: T[];
    multiple?: boolean;
    onValueChange?: (value: T[]) => void;
  },
) {
  const [items, setItems] = createStore<ItemEntry<T>[]>([]);

  const registerItem = (value?: T) => {
    const id = Symbol();

    // 初始 open 状态：value 存在且在 defaultValue 中才默认开启
    const initialOpen =
      value !== undefined ? (props.defaultValue ?? []).includes(value) : false;

    const index = items.length;

    setItems(items.length, { id, value, isOpen: initialOpen });

    return index;
  };

  const isOpen = (index: number) => items[index].isOpen ?? false;

  const unregisterItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const toggle = (index: number) => {
    // 单选模式，关闭其他所有
    if (!props.multiple) {
      setItems(
        produce((items) => {
          const target = items[index];
          const next = !target.isOpen;
          target.isOpen = next;

          if (next)
            items.forEach((item, idx) => {
              if (idx === index) return;

              item.isOpen = false;
            });
          // https://base-ui.com/react/components/accordion#root 文档有问题，value为undefined时onValueChange的参数不可能是T[]
          props.onValueChange?.(
            items
              .filter((v) => v.isOpen && v.value)
              .map(({ value }) => value) as T[],
          );
        }),
      );
    } else {
      setItems(index, "isOpen", (prev) => !prev);
    }
  };

  return (
    <AccordionContext.Provider
      value={{
        orientation: props.orientation,
        isOpen,
        toggle,
        registerItem,
        unregisterItem,
      }}
    >
      {props.children}
    </AccordionContext.Provider>
  );
}

export const useAccordionContext = <T extends string | number>() => {
  const context = useContext(AccordionContext);
  if (!context)
    throw new Error("useAccordionContext must be used in AccordionProvider");

  return context as AccordionContextValue<T>;
};
