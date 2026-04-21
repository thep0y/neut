import { createContext, useContext } from "solid-js";
import type { AccordionValue } from "../Accordion";

interface AccordionItemContextValue {
  value: AccordionValue;
  triggerId: string;
  contentId: string;
  open: () => boolean;
  disabled?: boolean;
}

export const AccordionItemContext = createContext<AccordionItemContextValue>();

export const useAccordionItemContext = () => {
  const context = useContext(AccordionItemContext);
  if (!context)
    throw new Error(
      "useAccordionItemContext must be used in AccordionProvider",
    );

  return context;
};
