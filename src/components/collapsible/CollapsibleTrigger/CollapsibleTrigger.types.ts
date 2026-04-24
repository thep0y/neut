import type { ButtonProps } from "~/components/button";

export type CollapsibleTriggerProps = Omit<ButtonProps<"button">, "onClick">;
