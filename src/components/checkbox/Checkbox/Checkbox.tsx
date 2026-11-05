import {
  createMemo,
  createSignal,
  createUniqueId,
  mergeProps,
  splitProps,
} from "solid-js";
import type { CheckboxProps } from "./Checkbox.types";
import { clsx } from "~/utils";
import { classes } from "./Checkbox.styles";
import { CheckboxIndicator } from "../CheckboxIndicator";

export const Checkbox = (props: CheckboxProps) => {
  const defaultID = createUniqueId();
  const merged = mergeProps(
    { id: defaultID, name: defaultID, defaultChecked: false } as const,
    props,
  );

  const [local, others] = splitProps(merged, [
    "name",
    "id",
    "checked",
    "defaultChecked",
    "onChange",
    "disabled",
    "class",
    "classList",
  ]);

  const [internalChecked, setInternalChecked] = createSignal(
    local.defaultChecked,
  );

  const checked = createMemo(() => local.checked ?? internalChecked());

  let inputRef: HTMLInputElement | undefined;

  /**
   * 可见控件（span）的点击只是"代理"：真正承载状态的是隐藏 input。
   * 统一从 input 走一遍原生点击，这样用户点 span、点 label（原生转发到 input）
   * 两条路径完全一致，不会各改一次状态导致净变化为 0、onChange 触发两次。
   */
  const handleClick = (event: MouseEvent) => {
    if (local.disabled) return;
    // label 有两种关联方式：
    // - <label for> 是兄弟节点：点击 label 由浏览器原生转发，span 的
    //   handleClick 根本不会执行；
    // - <label> 包住 span：浏览器会转发，同时 span 的点击也会冒泡上来。
    // 只有后一种需要取消原生转发，否则会把 input 点两次。判断依据是当前
    // 点击目标是否在这个 label 内、且 label.control 正是我们的 input。
    const target = event.target as Element | null;
    const label = target?.closest("label") as HTMLLabelElement | null;
    if (label?.control === inputRef) {
      // label 包住 span 时浏览器也会转发一次；取消原生转发，改由下面
      // 的 input.click() 统一走一次，保证 jsdom / 浏览器行为一致。
      event.preventDefault();
    }
    inputRef?.click();
  };

  return (
    <>
      <span
        data-slot="checkbox"
        role="checkbox"
        tabIndex={0}
        aria-checked={checked()}
        aria-disabled={local.disabled}
        data-disabled={local.disabled}
        data-checked={checked()}
        aria-labelledby={local.id}
        class={clsx(classes, local.class)}
        classList={local.classList}
        onClick={(event) => handleClick(event)}
        {...others}
      >
        <CheckboxIndicator checked={checked()} />
      </span>
      <input
        ref={(el) => {
          inputRef = el;
        }}
        id={local.id}
        type="checkbox"
        checked={checked()}
        tabIndex={-1}
        aria-hidden="true"
        name={local.name}
        class="sr-only"
        disabled={local.disabled}
        // 隐藏 input 是表单语义与 `<label for>` 原生转发的落点，
        // 它的变化必须回写到组件状态，否则会出现
        // 「可见 span 显示已勾选、input.checked 仍是 false」的脱节
        // （表单提交拿不到值，label 的转发也会被下一次点击翻回去）。
        // 隐藏 input 是唯一的变更入口：用户点 span 会转发到这里，
        // `<label for>` 的原生转发也落在这里，因此不会双触发
        onChange={(event) => {
          if (local.disabled) return;
          const next = event.currentTarget.checked;
          setInternalChecked(next);
          local.onChange?.(next);
        }}
      />
    </>
  );
};
