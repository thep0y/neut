import type { ComboboxContextValue } from "./Combobox/Combobox.types";

/**
 * Combobox 两种输入形态（普通 Input / chips Input）共用的键盘与
 * aria-activedescendant 逻辑。
 *
 * 只在输入框上处理按键，焦点始终留在输入框；高亮项通过 activeIndex 表达。
 */
export function createComboboxKeyboard(ctx: ComboboxContextValue) {
  /** 当前高亮项对应的 option 元素 id（没有高亮时为 undefined） */
  const activeOptionId = () => {
    const item = ctx.filteredItems()[ctx.activeIndex()];
    return item === undefined ? undefined : ctx.optionId(item);
  };

  /** 从 from 开始沿 step 找第一个非 disabled 项；找不到返回 -1 */
  const findEnabled = (
    list: readonly unknown[],
    from: number,
    step: 1 | -1,
  ) => {
    for (let i = 0; i < list.length; i++) {
      const index =
        (((from + step * i) % list.length) + list.length) % list.length;
      if (!ctx.isItemDisabled(list[index])) return index;
    }
    return -1;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const list = ctx.filteredItems();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      ctx.setOpen(true, "input-change", e);
      ctx.setActiveIndex(findEnabled(list, ctx.activeIndex() + 1, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      ctx.setOpen(true, "input-change", e);
      const start =
        ctx.activeIndex() <= 0 ? list.length - 1 : ctx.activeIndex() - 1;
      ctx.setActiveIndex(findEnabled(list, start, -1));
    } else if (e.key === "Home") {
      e.preventDefault();
      ctx.setOpen(true, "input-change", e);
      ctx.setActiveIndex(findEnabled(list, 0, 1));
    } else if (e.key === "End") {
      e.preventDefault();
      ctx.setOpen(true, "input-change", e);
      ctx.setActiveIndex(findEnabled(list, list.length - 1, -1));
    } else if (e.key === "Enter" && ctx.open()) {
      e.preventDefault();
      const item = list[ctx.activeIndex()];
      if (item !== undefined && !ctx.isItemDisabled(item))
        ctx.selectItem(item, e);
    } else if (e.key === "Escape" && ctx.open()) {
      e.preventDefault();
      ctx.close("escape-key", e);
    }
  };

  return { activeOptionId, onKeyDown };
}
