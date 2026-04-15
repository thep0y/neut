import { createContext, type ParentProps, useContext } from "solid-js";

interface AccordionItemContextValue {
  index: number;
  open: () => boolean;
  disabled?: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextValue>();

export function AccordionItemProvider(
  props: ParentProps & {
    index: number;
    open: () => boolean;
    disabled?: boolean;
  },
) {
  return (
    <AccordionItemContext.Provider
      value={{
        index: props.index,
        open: props.open,
        disabled: props.disabled,
      }}
    >
      {props.children}
    </AccordionItemContext.Provider>
  );
}

export const useAccordionItemContext = () => {
  const context = useContext(AccordionItemContext);
  if (!context)
    throw new Error(
      "useAccordionItemContext must be used in AccordionProvider",
    );

  return context;
};
