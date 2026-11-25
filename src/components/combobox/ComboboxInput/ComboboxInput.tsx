import { Show, createEffect, mergeProps, onCleanup, type JSX } from "solid-js";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/components/input-group";
import { clsx } from "~/utils";
import { useComboboxContext } from "../Combobox/Combobox.context";
import { ComboboxClear } from "../ComboboxClear";
import { createComboboxKeyboard } from "../combobox.keyboard";

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

  const { activeOptionId, onKeyDown } = createComboboxKeyboard(ctx, disabled);

  const hasValue = () => {
    const current = ctx.value();
    if (current == null) return false;
    if (Array.isArray(current)) return current.length > 0;
    return current !== "";
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
