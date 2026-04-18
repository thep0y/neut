import { mergeProps, splitProps, type ValidComponent } from "solid-js";
import { clsx } from "~/lib/utils";
import type { ItemProps } from "./Item.types";
import { itemVariants } from "./Item.styles";
import { Dynamic } from "solid-js/web";

export const Item = <T extends ValidComponent = "div">(props: ItemProps<T>) => {
  const merged = mergeProps(
    { variant: "ghost", size: "sm", as: "div" } as const,
    props,
  );

  const [local, others] = splitProps(merged, [
    "as",
    "variant",
    "size",
    "class",
    "classList",
  ]);

  return (
    // @ts-expect-error
    <Dynamic
      component={local.as}
      data-slot="item"
      class={clsx(
        itemVariants({ variant: local.variant, size: local.size }),
        local.class,
      )}
      {...others}
    />
  );
};
