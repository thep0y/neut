import type { ButtonProps } from "~/components/button";

export type AlertDialogCancelProps = Pick<
  ButtonProps<"button">,
  "variant" | "size" | "class" | "children"
>;
