import { createMemo, splitProps, type JSX } from "solid-js";
import { clsx } from "~/utils";
import { toggleVariants } from "~/components/toggle/Toggle/Toggle.styles";
import { useToggleGroupContext } from "../ToggleGroup/ToggleGroup.context";
import type { ToggleGroupItemProps } from "./ToggleGroupItem.types";

export function ToggleGroupItem(props: ToggleGroupItemProps): JSX.Element {
  const ctx = useToggleGroupContext("ToggleGroupItem");

  const [local, rest] = splitProps(props, [
    "value",
    "variant",
    "size",
    "class",
    "disabled",
    "onClick",
    "onKeyDown",
    "type",
  ]);

  const variant = createMemo(() => ctx.variant() || local.variant || "default");
  const size = createMemo(() => ctx.size() || local.size || "default");
  const pressed = createMemo(() => ctx.value().includes(local.value));
  const disabled = () => ctx.disabled() || !!local.disabled;

  const select = () => {
    if (disabled()) return;
    const current = ctx.value();
    if (ctx.multiple()) {
      ctx.setValue(
        pressed()
          ? current.filter((value) => value !== local.value)
          : [...current, local.value],
      );
    } else {
      ctx.setValue([local.value]);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    (local.onKeyDown as any)?.(e);
    if (e.defaultPrevented || disabled()) return;

    const directions = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
    if (!directions.includes(e.key)) return;
    e.preventDefault();

    const group = (e.currentTarget as HTMLElement).closest(
      '[data-slot="toggle-group"]',
    );
    const items = Array.from(
      group?.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]') ??
        [],
    );
    if (items.length === 0) return;

    const currentIndex = items.indexOf(e.currentTarget as HTMLElement);
    const forward = e.key === "ArrowDown" || e.key === "ArrowRight";
    const delta = forward ? 1 : -1;
    const nextIndex = (currentIndex + delta + items.length) % items.length;
    items[nextIndex].focus();
  };

  return (
    <button
      type={(local.type as "button") ?? "button"}
      disabled={disabled()}
      data-slot="toggle-group-item"
      data-variant={variant()}
      data-size={size()}
      data-spacing={ctx.spacing()}
      aria-pressed={pressed()}
      data-state={pressed() ? "on" : "off"}
      class={clsx(
        "shrink-0 focus:z-10 focus-visible:z-10",
        toggleVariants({ variant: variant(), size: size() }),
        local.class,
      )}
      onClick={(e) => {
        (local.onClick as any)?.(e);
        if (!e.defaultPrevented) select();
      }}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {props.children}
    </button>
  );
}
