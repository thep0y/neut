import { splitProps } from "solid-js";
import type { SelectGroupProps } from "./SelectGroup.types";
import { clsx } from "~/utils";

/**
 * SelectGroup：把若干 SelectItem 包成 role="group" 的 li。
 *
 * 必须像同目录的其它部件一样透传 `class` / `classList` 与其余属性：
 * 此前实现只渲染 `{props.children}`，调用方传的 class、data-* 全被静默丢弃。
 */
export function SelectGroup(props: SelectGroupProps) {
  const [local, others] = splitProps(props, ["class", "classList", "children"]);

  return (
    <li
      data-slot="select-group"
      role="group"
      class={clsx(local.class)}
      classList={local.classList}
      {...others}
    >
      {local.children}
    </li>
  );
}
