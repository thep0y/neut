import { onCleanup, splitProps } from "solid-js";
import { clsx } from "~/lib/utils";
import { useAccordionContext } from "../Accordion/Accordion.context";
import { AccordionItemProvider } from "./AccordionItem.context";
import type { AccordionItemProps } from "./AccordionItem.types";

export const AccordionItem = <T extends string | number>(
  props: AccordionItemProps<T>,
) => {
  const { orientation, isOpen, registerItem, unregisterItem } =
    useAccordionContext<T>();

  const [local, others] = splitProps(props, [
    "value",
    "onOpenChange",
    "disabled",
    "class",
    "classList",
    "children",
  ]);

  const index = registerItem(local.value);

  onCleanup(() => unregisterItem(index));

  const open = () => isOpen(index);

  return (
    <div
      class={clsx("not-last:border-b", local.class)}
      data-slot="accordion-item"
      data-orientation={orientation}
      data-open={open() ? "" : null}
      data-closed={open() ? null : ""}
      data-index={index}
      data-disabled={props.disabled ? "" : null}
      {...others}
    >
      <AccordionItemProvider
        index={index}
        open={open}
        disabled={props.disabled}
      >
        {local.children}
      </AccordionItemProvider>
    </div>
  );
};
