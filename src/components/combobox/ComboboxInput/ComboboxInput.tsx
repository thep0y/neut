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

  /** 当前高亮项对应的 option 元素 id（没有高亮时为 undefined） */
  const activeOptionId = () => {
    const value = ctx.filteredItems()[ctx.activeIndex()];
    return value === undefined ? undefined : ctx.optionId(value);
  };

  const hasValue = () => {
    const current = ctx.value();
    if (current == null) return false;
    if (Array.isArray(current)) return current.length > 0;
    return current !== "";
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (disabled()) return;
    const list = ctx.filteredItems();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      ctx.setOpen(true, "input-change", e);
      ctx.setActiveIndex(
        list.length === 0 ? -1 : (ctx.activeIndex() + 1) % list.length,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      ctx.setOpen(true, "input-change", e);
      // 没有高亮时 ArrowUp 应落在**最后一项**：此前用
      // `(activeIndex - 1 + len) % len`，activeIndex 为 -1 时得到 len-2，
      // 三项时错误地停在第二项。
      ctx.setActiveIndex(
        list.length === 0
          ? -1
          : ctx.activeIndex() <= 0
            ? list.length - 1
            : ctx.activeIndex() - 1,
      );
    } else if (e.key === "Home") {
      // Home / End 跳到第一项 / 最后一项
      e.preventDefault();
      ctx.setOpen(true, "input-change", e);
      ctx.setActiveIndex(list.length === 0 ? -1 : 0);
    } else if (e.key === "End") {
      e.preventDefault();
      ctx.setOpen(true, "input-change", e);
      ctx.setActiveIndex(list.length === 0 ? -1 : list.length - 1);
    } else if (e.key === "Enter" && ctx.open()) {
      e.preventDefault();
      const item = ctx.filteredItems()[ctx.activeIndex()];
      if (item !== undefined) ctx.selectItem(item, e);
    } else if (e.key === "Escape" && ctx.open()) {
      e.preventDefault();
      ctx.close("escape-key", e);
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
        // combobox 语义：输入框是 combobox 本体，浮层里的列表是它的 listbox
        role="combobox"
        aria-expanded={ctx.open()}
        aria-controls={ctx.open() ? ctx.listId : undefined}
        aria-autocomplete="list"
        // 高亮项通过 aria-activedescendant 表达（焦点始终留在输入框上）
        aria-activedescendant={activeOptionId()}
        placeholder={local.placeholder}
        disabled={disabled()}
        aria-invalid={local["aria-invalid"] as any}
        value={ctx.inputValue()}
        onInput={(value) => {
          const next = String(value);
          ctx.setInputValue(next);
          ctx.setFilterValue(next);
          ctx.setOpen(true, "input-change");
          if (!ctx.multiple() && next.trim() === "") {
            ctx.setValue(null);
            ctx.setFilterValue("");
          }
        }}
        onFocus={() => ctx.setOpen(true, "input-focus")}
        onClick={() => ctx.setOpen(true, "trigger-press")}
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
