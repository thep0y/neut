import type { BaseProps, PolymorphicProps } from "~/types";

export type SwitchProps = Omit<
  PolymorphicProps<
    "span",
    BaseProps & {
      size?: "sm" | "md";
      disabled?: boolean;
      defaultChecked?: boolean;
      checked?: boolean;
      onCheckedChange?: (checked: boolean) => void;
      /** 原生表单字段名，提交到 FormData */
      name?: string;
      /** 原生表单值，默认 "on"（与 checkbox 一致） */
      value?: string;
    },
    false
  >,
  "children"
>;
