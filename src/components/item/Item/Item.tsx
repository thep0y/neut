import { mergeProps, splitProps, type ValidComponent } from "solid-js";
import { clsx } from "~/utils";
import type { ItemProps } from "./Item.types";
import { itemVariants } from "./Item.styles";
import { Dynamic } from "solid-js/web";

export const Item = <T extends ValidComponent = "div">(props: ItemProps<T>) => {
  const merged = mergeProps(
    { variant: "ghost", size: "sm", component: "div" } as const,
    props,
  );

  const [local, others] = splitProps(merged, [
    "component",
    "variant",
    "size",
    "class",
    "classList",
  ]);

  return (
    <Dynamic
      component={local.component as ValidComponent}
      data-slot="item"
      // 子部件样式用 group-data-[size=…]/item 与 group-data-[variant=…]/item 选择，
      // 因此这两个状态必须真的写到元素上（否则那几条响应式样式永远不会生效）
      data-variant={local.variant}
      data-size={local.size}
      class={clsx(
        itemVariants({ variant: local.variant, size: local.size }),
        local.class,
      )}
      classList={local.classList}
      {...others}
    />
  );
};
