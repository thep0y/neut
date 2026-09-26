import type { ValidComponent } from "solid-js";
import type { Button } from "~/components/button";
import type { PolymorphicProps } from "~/types";

export type DropdownMenuTriggerProps<
  T extends ValidComponent = typeof Button<"button">,
> = PolymorphicProps<T>;
