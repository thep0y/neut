import { ChevronDown } from "lucide-solid";
import { splitProps } from "solid-js";
import { clsx } from "~/lib/utils";
import { useAccordionContext } from "../Accordion/Accordion.context";
import { useAccordionItemContext } from "../AccordionItem/AccordionItem.context";
import type { AccordionTriggerProps } from "./AccordionTrigger.types";

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
      class="flex"
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
        class={clsx(
          "group/accordion-trigger relative flex flex-1 items-start justify-between rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:select-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-neutral-500 dark:**:data-[slot=accordion-trigger-icon]:text-neutral-400",
          local.class,
        )}
        onClick={handleClick}
        data-orientation={orientation}
        data-open={open()}
        disabled={disabled}
      >
        {local.children}
        <ChevronDown
          class="pointer-events-none shrink-0 data-[open=true]:-rotate-180 transition-[rotate] duration-200"
          data-slot="accordion-trigger-icon"
          data-open={open()}
        />
      </button>
    </h3>
  );
};
