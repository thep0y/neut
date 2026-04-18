import type { BaseProps, PolymorphicProps } from "~/types";

export type SwitchProps = Omit<
  PolymorphicProps<
    "span",
    BaseProps & {
      size?: "sm" | "md";
      disabled?: boolean;
      defaultChecked?: boolean;
      onChange?: (checked: boolean) => void;
    },
    false
  >,
  "children"
>;
