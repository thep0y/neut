import type { ComboboxContextValue } from "./Combobox/Combobox.types";

/**
 * Combobox 两种输入形态（普通 Input / chips Input）共用的键盘与
 * aria-activedescendant 逻辑。
 *
 * 只在输入框上处理按键，焦点始终留在输入框；高亮项通过 activeIndex 表达。
 */
export function createComboboxKeyboard(
  ctx: ComboboxContextValue,
  isDisabled: () => boolean,
) {
  /** 当前高亮项对应的 option 元素 id（没有高亮时为 undefined） */
  const activeOptionId = () => {
    const item = ctx.filteredItems()[ctx.activeIndex()];
    return item === undefined ? undefined : ctx.optionId(item);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (isDisabled()) return;
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
      // 没有高亮时 ArrowUp 应落在最后一项，而不是 len-2
      ctx.setActiveIndex(
        list.length === 0
          ? -1
          : ctx.activeIndex() <= 0
            ? list.length - 1
            : ctx.activeIndex() - 1,
      );
    } else if (e.key === "Home") {
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

  return { activeOptionId, onKeyDown };
}
