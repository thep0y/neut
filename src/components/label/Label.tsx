import { splitProps } from "solid-js";
import type { LabelProps } from "./Label.types";
import { clsx } from "~/utils";

export const Label = (props: LabelProps) => {
  let ref: HTMLLabelElement | undefined;
  const [local, others] = splitProps(props, ["for", "class", "classList"]);

  const handleClick = (e: MouseEvent) => {
    // 兄弟元素用 for 查找
    const htmlFor = local.for;
    if (htmlFor) {
      const target = document.querySelector<HTMLElement>(
        `[aria-labelledby="${htmlFor}"]`,
      );
      if (!target) return;
      // 这里点的是 `for` 指向的自定义控件（可见的那个），
      // 原生 `<label for>` 转发的是隐藏的原生控件，两者分工不同，不会重复。
      // 自定义控件一侧必须避免"再代理一次"（见 Checkbox 的可见 span），
      // 否则同一个 input 会被点两遍、状态翻转两次回到原值。
      target.click();
      return;
    }

    // 子元素直接查询有 `aria-labelledby` 属性
    const target = ref?.querySelector<HTMLElement>("[aria-labelledby]");
    if (target && !target.contains(e.target as Node)) {
      e.preventDefault(); // 阻止 label 原生的自动点击转发
      target.click(); // 手动触发一次
    }
  };

  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: ignore
    <label
      ref={ref}
      for={local.for}
      data-slot="label"
      class={clsx(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        local.class,
      )}
      classList={local.classList}
      onClick={handleClick}
      {...others}
    />
  );
};
