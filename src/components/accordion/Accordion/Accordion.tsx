import { mergeProps, splitProps } from "solid-js";
import { clsx } from "~/lib/utils";
import { AccordionProvider } from "./Accordion.context";
import type { AccordionProps } from "./Accordion.types";

export const Accordion = <T extends string | number>(
  props: AccordionProps<T>,
) => {
  const merged = mergeProps(
    {
      hiddenUntilFound: false,
      loopFocus: true,
      multiple: false,
      disabled: false,
      orientation: "vertical",
      keepMounted: false,
      dir: "ltr",
    } as const,
    props,
  );

  const [local, others] = splitProps(merged, [
    "defaultValue",
    "value",
    "onValueChange",
    "hiddenUntilFound",
    "loopFocus",
    "multiple",
    "disabled",
    "orientation",
    "class",
    "classList",
    "keepMounted",
    "dir",
    "children",
  ]);

  return (
    <section
      class={clsx("flex", "w-full", "flex-col", "max-w-lg", local.class)}
      data-orientation={local.orientation}
      data-slot="accordion"
      dir={local.dir}
      {...others}
    >
      <AccordionProvider
        orientation={local.orientation}
        defaultValue={props.defaultValue}
        value={props.value}
        multiple={props.multiple}
        onValueChange={props.onValueChange}
      >
        {/* children 是1个以上 AccordionItem */}
        {local.children}
      </AccordionProvider>
    </section>
  );
};
