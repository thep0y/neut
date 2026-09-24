import { createEffect, onCleanup, type Accessor } from "solid-js";

/** 菜单自身(根菜单/子菜单)的 popup 容器,允许在锁滚动期间继续在菜单内部滚动 */
const MENU_POPUP_SELECTOR =
  '[data-slot="context-menu-content"],[data-slot="context-menu-sub-content"]';

// 多个菜单/嵌套菜单可能同时持锁,用计数避免其中一个关闭就提前恢复页面滚动。
let lockCount = 0;
let release: (() => void) | undefined;

/** 元素自身是否建立了滚动容器(与 positioner 里的判断口径一致) */
function isOverflowElement(el: Element): boolean {
  const { overflow, overflowX, overflowY } = getComputedStyle(el);
  return /auto|scroll|overlay|hidden/.test(overflow + overflowX + overflowY);
}

/**
 * 页面的滚动容器:html 自己建立了滚动上下文时锁 html,否则锁 body
 * ——把 overflow 写在另一个元素上并不会锁住页面(Base UI 同样的判断)。
 */
function getViewportScroller(): HTMLElement {
  const html = document.documentElement;
  return isOverflowElement(html) ? html : document.body;
}

function supportsStableScrollbarGutter(): boolean {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("scrollbar-gutter", "stable")
  );
}

function lockViewport(): () => void {
  const html = document.documentElement;
  const body = document.body;
  const scroller = getViewportScroller();

  const previous = {
    htmlScrollbarGutter: html.style.scrollbarGutter,
    scrollerOverflowX: scroller.style.overflowX,
    scrollerOverflowY: scroller.style.overflowY,
    bodyPaddingRight: body.style.paddingRight,
    scrollTop: scroller.scrollTop,
    scrollLeft: scroller.scrollLeft,
  };

  // 抵消滚动条消失带来的横向抖动:能用 scrollbar-gutter 就用它,
  // 否则退化成给 body 补一个滚动条宽度的右内边距。
  // 只有页面自身真的存在占位滚动条时才需要补偿:滚动条长在某个嵌套容器上时,
  // 锁 html/body 并不会移除那条滚动条,再给 html 加 gutter 只会额外多出一条空白
  // (滚动条 + gutter 双倍宽度),反而破坏布局。
  const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
  const gutterSupported = supportsStableScrollbarGutter();
  if (scrollbarWidth > 0) {
    if (gutterSupported) {
      html.style.scrollbarGutter = "stable";
    } else {
      const padding =
        Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${padding + scrollbarWidth}px`;
    }
  }

  scroller.style.overflowX = "hidden";
  scroller.style.overflowY = "hidden";

  // 兜底:部分浏览器即使 overflow:hidden 仍能被滚轮/触摸滚动,
  // 因此直接拦截菜单之外的滚动事件;菜单内部(popup 里)保留滚动能力。
  const preventScroll = (event: Event) => {
    const target = event.target;
    if (target instanceof Element && target.closest(MENU_POPUP_SELECTOR)) {
      return;
    }
    event.preventDefault();
  };
  document.addEventListener("wheel", preventScroll, { passive: false });
  document.addEventListener("touchmove", preventScroll, { passive: false });

  return () => {
    html.style.scrollbarGutter = previous.htmlScrollbarGutter;
    if (!gutterSupported) {
      body.style.paddingRight = previous.bodyPaddingRight;
    }
    scroller.style.overflowX = previous.scrollerOverflowX;
    scroller.style.overflowY = previous.scrollerOverflowY;
    document.removeEventListener("wheel", preventScroll);
    document.removeEventListener("touchmove", preventScroll);
    scroller.scrollTop = previous.scrollTop;
    scroller.scrollLeft = previous.scrollLeft;
  };
}

function acquireLock(): () => void {
  lockCount += 1;
  if (lockCount === 1) release = lockViewport();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount -= 1;
    if (lockCount === 0) {
      release?.();
      release = undefined;
    }
  };
}

/**
 * 菜单打开时锁定页面滚动,关闭后恢复——对齐 Base UI menu 的 `modal` 行为
 * (文档滚动被锁定、菜单之外的滚轮/触摸滚动被拦截),避免浮窗锚点随页面滚动而"飘移"。
 *
 * 与 Base UI 一致:只有根菜单会加锁(子菜单不锁),由根组件传入 `open() && modal()`。
 */
export function useScrollLock(locked: Accessor<boolean>) {
  createEffect(() => {
    if (!locked()) return;
    const unlock = acquireLock();
    onCleanup(unlock);
  });
}
