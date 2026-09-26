import type { ValidComponent } from "solid-js";
import type { Button } from "~/components/button";
import type { DialogTriggerProps } from "~/components/dialog";

export type AlertDialogTriggerProps<
  T extends ValidComponent = typeof Button<"button">,
> = DialogTriggerProps<T>;
