import {
  Show,
  createEffect,
  createMemo,
  onCleanup,
  splitProps,
} from "solid-js";
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

  /** 当前项是否是组内唯一的 Tab 停靠点（roving tabindex） */
  const resolveTabStop = (el: HTMLButtonElement) => {
    if (isDisabled()) return false;
    const group = el.closest<HTMLElement>('[data-slot="radio-group"]');
    if (!group) return false;
    const enabled = Array.from(
      group.querySelectorAll<HTMLButtonElement>(
        '[data-slot="radio-group-item"]:not(:disabled)',
      ),
    );
    const current = ctx.value();
    if (current !== undefined) {
      const selected = enabled.find((item) => item.dataset.value === current);
      if (selected) return selected === el;
    }
    return enabled[0] === el;
  };

  const isRTL = (el: HTMLElement) => {
    const group = el.closest<HTMLElement>('[data-slot="radio-group"]');
    const dir = group?.getAttribute("dir") ?? el.getAttribute("dir");
    if (dir === "rtl") return true;
    if (dir === "ltr") return false;
    return getComputedStyle(el).direction === "rtl";
  };

  const attachListeners = (el: HTMLButtonElement) => {
    const syncTabIndex = () => {
      el.tabIndex = resolveTabStop(el) ? 0 : -1;
    };
    syncTabIndex();
    // ref 之后才能拿到元素；effect 跟随选中值/禁用状态更新 roving tabindex。
    createEffect(syncTabIndex);
    const onClick = () => select();
    const onKeyDown = (e: KeyboardEvent) => {
      if (isDisabled()) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        // 走原生 click，保证用户的 onClick 与内部 select 同一条路径。
        el.click();
        return;
      }

      if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(e.key)) {
        e.preventDefault();
        const group = el.closest<HTMLElement>('[data-slot="radio-group"]');
        const values = Array.from(
          group?.querySelectorAll<HTMLButtonElement>(
            '[data-slot="radio-group-item"]:not(:disabled)',
          ) ?? [],
        )
          .map((item) => item.dataset.value)
          .filter((value): value is string => value !== undefined);
        if (values.length === 0) return;
        const currentIndex = values.indexOf(local.value);
        const rtl = isRTL(el);
        const forward =
          e.key === "ArrowDown" ||
          (e.key === "ArrowRight" && !rtl) ||
          (e.key === "ArrowLeft" && rtl);
        const nextIndex =
          currentIndex === -1
            ? forward
              ? 0
              : values.length - 1
            : (currentIndex + (forward ? 1 : -1) + values.length) %
              values.length;
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
      classList={local.classList}
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
