import { splitProps } from "solid-js";
import type { LabelProps } from "./Label.types";
import { clsx } from "~/lib/utils";

export const Label = (props: LabelProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: ignore
    <label
      data-slot="label"
      class={clsx(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        local.class,
      )}
      {...others}
    />
  );
};
