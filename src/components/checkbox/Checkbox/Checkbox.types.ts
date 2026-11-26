import type { BaseProps, PolymorphicProps } from "~/types";

interface BaseCheckboxProps {
  defaultChecked?: boolean;
  checked?: boolean;
  /** 半选状态；只影响 aria/data 与原生 input.indeterminate，不改变 checked */
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  disabled?: boolean;
}

export type CheckboxProps = Omit<
  PolymorphicProps<"span", BaseProps & BaseCheckboxProps, false>,
  "children" | "onClick"
>;
