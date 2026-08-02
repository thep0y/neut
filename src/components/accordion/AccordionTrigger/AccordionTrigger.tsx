import { ChevronDown } from "lucide-solid";
import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useAccordionContext } from "../Accordion/Accordion.context";
import { useAccordionItemContext } from "../AccordionItem/AccordionItem.context";
import type { AccordionTriggerProps } from "./AccordionTrigger.types";
import classes from "./AccordionTrigger.styles";

export const AccordionTrigger = (props: AccordionTriggerProps) => {
  const { orientation, toggle } = useAccordionContext();
  const { value, open, disabled, triggerId, contentId } =
    useAccordionItemContext();

  const [local, others] = splitProps(props, [
    "nativeButton",
    "class",
    "classList",
    "children",
  ]);

  const handleClick = () => {
    if (disabled) return;
    toggle(value);
  };

  return (
    <h3
      class={classes.title}
      data-orientation={orientation}
      data-open={open()}
      data-disabled={disabled ? "" : null}
      {...others}
    >
      <button
        type="button"
        id={triggerId}
        aria-controls={contentId}
        aria-expanded={open()}
        aria-disabled={disabled}
        data-accordion-trigger=""
        class={clsx(classes.button, local.class)}
        onClick={handleClick}
        data-orientation={orientation}
        data-open={open()}
        disabled={disabled}
      >
        {local.children}
        <ChevronDown
          class={classes.chevron}
          data-slot="accordion-trigger-icon"
          data-open={open()}
        />
      </button>
    </h3>
  );
};
