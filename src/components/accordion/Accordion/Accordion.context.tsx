import { createContext, type ParentProps, useContext } from "solid-js";
import type { AccordionValue } from "./Accordion.types";
import { createStore, produce } from "solid-js/store";

interface AccordionContextValue {
  orientation: "horizontal" | "vertical";
  isOpen: (value: string | number) => boolean;
  toggle: (value: string | number) => void;
}

const AccordionContext = createContext<AccordionContextValue>();

export function AccordionProvider(
  props: ParentProps & {
    orientation: "horizontal" | "vertical";
    defaultValue?: AccordionValue[];
    value?: AccordionValue[];
    multiple?: boolean;
    onValueChange?: (value: (string | number)[]) => void;
  },
) {
  const [openMap, setOpenMap] = createStore<
    Record<string, AccordionValue | undefined>
  >(
    (props.defaultValue ?? []).reduce(
      (acc, val) => {
        acc[String(val)] = val;
        return acc;
      },
      {} as Record<string, AccordionValue | undefined>,
    ),
  );

  const isOpen = (value: AccordionValue) => {
    if (props.value) {
      // 受控模式：依赖外部传入的数据
      return props.value.includes(value);
    }
    // 非受控模式：O(1) 的细粒度追踪，只订阅该 value 对应的 key
    return openMap[String(value)] !== undefined;
  };

  const toggle = (value: string | number) => {
    // 【受控模式】只通知外部，不改本地状态
    if (props.value) {
      const current = props.value;
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : props.multiple
          ? [...current, value]
          : [value];
      props.onValueChange?.(next);
      return;
    }

    // 非受控模式：细粒度更新，只改动涉及的 key
    const key = String(value);

    if (!props.multiple) {
      // 单选：关闭其他，切换自己
      setOpenMap(
        produce((draft) => {
          const isCurrentlyOpen = draft[key] !== undefined;

          for (const k in draft) {
            draft[k] = undefined;
          }

          if (!isCurrentlyOpen) {
            draft[key] = value;
          }
        }),
      );
    } else {
      // 多选：切换自己
      setOpenMap(key, (prev) => (prev !== undefined ? undefined : value));
    }

    // 通知外部
    const next = Object.values(openMap).filter(
      (v): v is AccordionValue => v !== undefined,
    );
    props.onValueChange?.(next);
  };

  const contextValue: AccordionContextValue = {
    // 使用 getter 确保 props.orientation 改变时能响应
    get orientation() {
      return props.orientation;
    },
    isOpen,
    toggle,
  };

  return (
    <AccordionContext.Provider value={contextValue}>
      {props.children}
    </AccordionContext.Provider>
  );
}

export const useAccordionContext = () => {
  const context = useContext(AccordionContext);
  if (!context)
    throw new Error("useAccordionContext must be used in AccordionProvider");

  return context;
};
