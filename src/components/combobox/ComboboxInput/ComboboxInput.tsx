import { Show, createEffect, mergeProps, onCleanup, type JSX } from "solid-js";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/components/input-group";
import { clsx } from "~/utils";
import { useComboboxContext } from "../Combobox/Combobox.context";
import { ComboboxClear } from "../ComboboxClear";

export function ComboboxInput(props: {
  placeholder?: string;
  disabled?: boolean;
  showClear?: boolean;
  class?: string;
  "aria-invalid"?: string | boolean;
  children?: JSX.Element;
}) {
  const ctx = useComboboxContext("ComboboxInput");
  const local = mergeProps({ showClear: false }, props);
  const disabled = () => ctx.disabled() || !!local.disabled;
  // 当 ComboboxInput 作为 ComboboxContent 子组件时（Popup 模式），
  // 此时 reference 已经由 ComboboxTrigger 设置。打开弹层后自动聚焦输入框。
  const mountedWithExternalReference = ctx.reference() !== undefined;
  let inputEl: HTMLInputElement | undefined;

  createEffect(() => {
    if (ctx.open() && mountedWithExternalReference && inputEl) {
      inputEl.focus();
    }
  });

  const hasValue = () => {
    const current = ctx.value();
    console.log(local.showClear, current);
    if (current == null) return false;
    if (Array.isArray(current)) return current.length > 0;
    return current !== "";
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (disabled()) return;
    const list = ctx.filteredItems();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      ctx.setOpen(true);
      ctx.setActiveIndex(
        list.length === 0 ? -1 : (ctx.activeIndex() + 1) % list.length,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      ctx.setOpen(true);
      ctx.setActiveIndex(
        list.length === 0
          ? -1
          : (ctx.activeIndex() - 1 + list.length) % list.length,
      );
    } else if (e.key === "Enter" && ctx.open()) {
      e.preventDefault();
      const item = ctx.filteredItems()[ctx.activeIndex()];
      if (item !== undefined) ctx.selectItem(item);
    } else if (e.key === "Escape" && ctx.open()) {
      e.preventDefault();
      ctx.close();
    }
  };

  return (
    <InputGroup
      ref={(el) => {
        if (!ctx.reference()) ctx.setReference(el);
        onCleanup(() => {
          if (ctx.reference() === el) ctx.setReference(undefined);
        });
      }}
      class={clsx("w-auto", local.class)}
    >
      <InputGroupInput
        ref={(el) => {
          inputEl = el;
        }}
        placeholder={local.placeholder}
        disabled={disabled()}
        aria-invalid={local["aria-invalid"] as any}
        value={ctx.inputValue()}
        onInput={(value) => {
          const next = String(value);
          ctx.setInputValue(next);
          ctx.setFilterValue(next);
          ctx.setOpen(true);
          if (!ctx.multiple() && next.trim() === "") {
            ctx.setValue(null);
            ctx.setFilterValue("");
          }
        }}
        onFocus={() => ctx.setOpen(true)}
        onClick={() => ctx.setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <InputGroupAddon align="inline-end">
        <Show when={local.showClear && hasValue() && !disabled()}>
          <ComboboxClear />
        </Show>
      </InputGroupAddon>
      {local.children}
    </InputGroup>
  );
}
