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
      // 原生 `<label for>` 已经会把这次点击转发给 `for` 对应的表单控件。
      // 当那个控件**就是**我们要点的目标时，本次点击到此为止：
      // 既不再手动点一次，也不让它继续冒泡到自定义控件——本仓库的自定义控件
      // （如 Checkbox）内部也是"把点击代理给隐藏 input"，
      // 两者叠加会让同一个 input 被点两次、状态净变化为 0、onChange 触发两次。
      if (ref?.control === target) {
        e.stopPropagation();
        return;
      }
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
