import { Show, createMemo, onCleanup, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useRadioGroupContext } from "../RadioGroup";
import type { RadioGroupItemProps } from "./RadioGroupItem.types";

/**
 * RadioGroupItem：一个 role="radio" 的按钮。选中时内部渲染指示圆点。
 * 通过 context 读取 RadioGroup 的选中值和禁用状态，支持受控/非受控。
 */
export function RadioGroupItem(props: RadioGroupItemProps) {
  const ctx = useRadioGroupContext("RadioGroupItem");

  const [local, rest] = splitProps(props, [
    "value",
    "disabled",
    "class",
    "classList",
    "style",
    "dir",
    "children",
  ]);

  const checked = createMemo(() => ctx.value() === local.value);
  const isDisabled = () => ctx.disabled() || !!local.disabled;

  const select = () => {
    if (isDisabled()) return;
    ctx.setValue(local.value);
  };

  let unregister: (() => void) | undefined;

  const attachListeners = (el: HTMLButtonElement) => {
    const onClick = () => select();
    const onKeyDown = (e: KeyboardEvent) => {
      if (isDisabled()) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select();
        return;
      }

      if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(e.key)) {
        e.preventDefault();
        const group = el.closest<HTMLElement>('[data-slot="radio-group"]');
        const values = Array.from(
          group?.querySelectorAll<HTMLElement>(
            '[data-slot="radio-group-item"]',
          ) ?? [],
        )
          .map((item) => item.dataset.value)
          .filter((value): value is string => value !== undefined);
        if (values.length === 0) return;
        const currentIndex = values.indexOf(local.value);
        const direction =
          e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
        const nextIndex =
          (currentIndex + direction + values.length) % values.length;
        const nextValue = values[nextIndex];
        ctx.setValue(nextValue);
        ctx.focusItem(nextValue);
      }
    };

    el.addEventListener("click", onClick);
    el.addEventListener("keydown", onKeyDown);
    unregister = ctx.registerItem(local.value, el);

    onCleanup(() => {
      el.removeEventListener("click", onClick);
      el.removeEventListener("keydown", onKeyDown);
      unregister?.();
    });
  };

  return (
    <button
      ref={attachListeners}
      type="button"
      role="radio"
      aria-checked={checked()}
      data-slot="radio-group-item"
      data-value={local.value}
      data-checked={checked() ? "" : undefined}
      disabled={isDisabled()}
      style={local.style}
      dir={local.dir}
      class={clsx(
        "group/radio-group-item peer relative flex aspect-square size-4 shrink-0 items-center justify-center rounded-full border border-input outline-none transition-colors",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary",
        "dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        "data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        local.class,
      )}
      {...rest}
    >
      <Show when={checked()}>
        <span
          data-slot="radio-group-indicator"
          class="size-2 rounded-full bg-primary-foreground"
        />
      </Show>
    </button>
  );
}
