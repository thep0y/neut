import { createUniqueId, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useAccordionContext } from "../Accordion/Accordion.context";
import { AccordionItemContext } from "./AccordionItem.context";
import type { AccordionItemProps } from "./AccordionItem.types";

export const AccordionItem = (props: AccordionItemProps) => {
  const { orientation, isOpen } = useAccordionContext();

  const [local, others] = splitProps(props, [
    "value",
    "onOpenChange",
    "disabled",
    "class",
    "classList",
    "children",
  ]);

  const id = createUniqueId();
  const triggerId = `accordion-trigger-${id}`;
  const contentId = `accordion-content-${id}`;

  const value = () => local.value ?? id;

  const open = () => isOpen(value());

  return (
    <div
      class={clsx("not-last:border-b", local.class)}
      data-slot="accordion-item"
      data-orientation={orientation}
      data-open={open()}
      data-disabled={props.disabled ? "" : null}
      {...others}
    >
      <AccordionItemContext.Provider
        value={{
          value: value(),
          triggerId,
          contentId,
          open,
          disabled: props.disabled,
        }}
      >
        {local.children}
      </AccordionItemContext.Provider>
    </div>
  );
};
