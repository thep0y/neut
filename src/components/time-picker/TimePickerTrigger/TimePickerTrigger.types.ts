import type { ValidComponent } from "solid-js";
import type { Button } from "~/components/button";
import type { BaseButtonProps } from "~/components/button/Button.types";
import type { PolymorphicProps } from "~/types";

export type TimePickerTriggerProps<
  T extends ValidComponent = typeof Button<"button">,
> = PolymorphicProps<T, BaseButtonProps>;
