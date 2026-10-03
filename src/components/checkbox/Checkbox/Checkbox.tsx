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
    // 只代理"真的点在可见控件上"的点击（label 转发来的那次 target 是隐藏 input）。
    if (event.target !== event.currentTarget) return;
    // 若存在某个 <label> 的 control 正是我们的隐藏 input，浏览器已经会为
    // 每次 label 点击转发一次原生点击；此时 span 再代理就会把同一个 input
    // 点两遍（状态翻两次回到原值、onChange 也触发两次）。
    // 注意 span 通常是 label 的**兄弟**节点，不能用 closest("label") 判断。
    if (hasLabelPointingAtInput()) return;
    inputRef?.click();
  };

  /** 页面里是否有 label 通过 for/id 指向我们的隐藏 input（原生会代为转发点击） */
  const hasLabelPointingAtInput = () =>
    !!inputRef?.id &&
    !!document.querySelector(`label[for="${CSS.escape(inputRef.id)}"]`);

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
        onClick={handleClick}
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
