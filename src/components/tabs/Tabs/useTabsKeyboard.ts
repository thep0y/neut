import { createRovingNavigation } from "~/utils";
import type { TabsContextValue } from "./Tabs.context";

/**
 * tablist 的 roving focus 键盘导航。
 *
 * 通用算法(方向映射、Home/End、loop、跳过 disabled、RTL)已抽到
 * `~/utils/roving-navigation`,这里只负责把 Tabs 的 context 接上去。
 *
 * 与 base-ui 一致:方向键只移动焦点(触发 trigger 的 onFocus → 更新高亮),
 * 不激活;激活靠点击(Enter/Space 触发 button 的 click)。
 * activateOnFocus 时的聚焦激活由 TabsTrigger 的 onFocus 处理,这里不做。
 */
export function useTabsKeyboard(ctx: TabsContextValue) {
  return createRovingNavigation({
    getItems: () => ctx.getTriggers(),
    orientation: ctx.orientation,
    dir: ctx.dir,
    loop: ctx.loop,
    // dir=auto 时由通用实现回退到 document.documentElement.dir
    onHighlight: ctx.setHighlightedValue,
  });
}
