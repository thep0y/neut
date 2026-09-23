import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  type Accessor,
} from "solid-js";
import {
  containingBlockOffset,
  createPositioner,
  flip,
  hide,
  offset,
  shift,
  size,
  type Placement,
  type Positioner,
  type ReferenceElement,
} from "~/lib";
import type {
  ContextMenuAlign,
  ContextMenuContextValue,
  ContextMenuOpenPopupState,
  ContextMenuItemEntry,
  ContextMenuOrientation,
  ContextMenuPopupContextValue,
  ContextMenuSide,
  ContextMenuSubmenuContextValue,
} from "../context-menu.types";
import { toContextMenuPlacement } from "../context-menu.utils";

/** 键盘字符导航的缓冲窗口(毫秒) */
const TYPEAHEAD_TIMEOUT = 500;

export interface CreateContextMenuPopupOptions {
  root: ContextMenuContextValue;
  /** 该浮层自身的打开状态(根菜单 = root.open,子菜单 = submenu.open) */
  open: Accessor<boolean>;
  /** 父级浮层:根菜单为 undefined,子菜单为触发它的那个浮层 */
  parent?: ContextMenuPopupContextValue;
  isSubmenu: boolean;
  /** 定位锚点:根菜单是鼠标坐标的虚拟元素,子菜单是子菜单触发器 */
  reference: Accessor<ReferenceElement | undefined>;
  side: Accessor<ContextMenuSide>;
  align: Accessor<ContextMenuAlign>;
  sideOffset: Accessor<number>;
  alignOffset: Accessor<number>;
  collisionPadding: Accessor<number>;
  dir: Accessor<"ltr" | "rtl" | "auto" | undefined>;
  /** 子菜单可以覆盖根组件的行为;不传则回退到 root 上的值 */
  loopFocus?: Accessor<boolean>;
  orientation?: Accessor<ContextMenuOrientation>;
  highlightItemOnHover?: Accessor<boolean>;
  /** 子菜单场景下提供,用于 ArrowLeft / Escape 只关闭当前子菜单 */
  submenu?: ContextMenuSubmenuContextValue;
}

export interface ContextMenuPopupRuntime {
  popupCtx: ContextMenuPopupContextValue;
  pos: Positioner;
  /** 真正承载焦点的 popup 元素 */
  popupEl: Accessor<HTMLElement | undefined>;
  setPopupEl: (el: HTMLElement | undefined) => void;
  /** 负责定位的外层元素 */
  positionerEl: Accessor<HTMLElement | undefined>;
  setPositionerEl: (el: HTMLElement | undefined) => void;
  /** size 中间件算出的可用高度,用于 max-height 滚动 */
  availableHeight: Accessor<number | undefined>;
  placement: Accessor<Placement>;
  onKeyDown: (e: KeyboardEvent) => void;
  /** 打开后聚焦 popup 并把高亮落到第一项 */
  setupOnOpen: () => void;
}

/**
 * 一个浮层(根菜单或子菜单)的运行时:定位、菜单项注册、高亮/键盘导航、
 * 类型头(typeahead)以及开关联动都收敛在这里。`ContextMenuContent` 与
 * `ContextMenuSubContent` 共用它,只是传入的锚点与父子关系不同。
 *
 * 交互模型:焦点始终落在 popup 上,高亮项通过 `aria-activedescendant` 表达
 * (而不是把真实焦点在菜单项之间搬来搬去)。这与本项目 Select 的做法一致,
 * 既避免了焦点在 Portal / 子菜单之间的来回跳,也让"关闭后把焦点还给触发器"
 * 变得非常简单。
 */
export function createContextMenuPopupRuntime(
  options: CreateContextMenuPopupOptions,
): ContextMenuPopupRuntime {
  const { root } = options;
  const loopFocus = () => options.loopFocus?.() ?? root.loopFocus();
  const orientation = () => options.orientation?.() ?? root.orientation();
  const highlightItemOnHover = () =>
    options.highlightItemOnHover?.() ?? root.highlightItemOnHover();

  const [popupEl, setPopupEl] = createSignal<HTMLElement>();
  const [positionerEl, setPositionerEl] = createSignal<HTMLElement>();
  const [items, setItems] = createSignal<ContextMenuItemEntry[]>([]);
  const [activeId, setActiveIdInternal] = createSignal<string | undefined>();
  const [openPopupState, setOpenPopupState] =
    createSignal<ContextMenuOpenPopupState>();
  const [availableHeight, setAvailableHeight] = createSignal<number>();

  const menuId = `context-menu-popup-${createUniqueId()}`;

  const pos = createPositioner(options.reference, positionerEl, {
    placement: () =>
      toContextMenuPlacement(options.side(), options.align(), options.dir()),
    strategy: "fixed",
    middleware: () => [
      offset({
        mainAxis: options.sideOffset(),
        crossAxis: options.alignOffset(),
      }),
      flip(),
      shift({ padding: options.collisionPadding() }),
      size({
        padding: options.collisionPadding(),
        apply: ({ availableHeight }) => setAvailableHeight(availableHeight),
      }),
      hide(),
      containingBlockOffset(),
    ],
  });

  // 按 DOM 顺序排序,避免调用方用 <For> 动态生成菜单项时顺序错乱。
  const orderedItems = createMemo(() => {
    const list = items();
    return [...list].sort((a, b) => {
      if (a.element === b.element) return 0;
      const relation = a.element.compareDocumentPosition(b.element);
      return relation & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  });

  const enabledItems = createMemo(() =>
    orderedItems().filter((item) => !item.disabled()),
  );

  const activeEntry = () =>
    orderedItems().find((item) => item.id === activeId());

  const registerItem = (entry: ContextMenuItemEntry) => {
    setItems((list) => [...list, entry]);
    return () => setItems((list) => list.filter((it) => it.id !== entry.id));
  };

  const closeOpenPopup = () => setOpenPopupState(undefined);

  /** 高亮某项;若高亮切到了别的项,顺手关掉已展开的子菜单 */
  const setActiveId = (id: string | undefined) => {
    setActiveIdInternal(id);
    const state = openPopupState();
    if (state && state.id !== id) closeOpenPopup();
  };

  const moveActive = (delta: 1 | -1) => {
    const list = enabledItems();
    if (list.length === 0) return;
    const currentIndex = list.findIndex((item) => item.id === activeId());
    let nextIndex: number;
    if (currentIndex === -1) {
      nextIndex = delta > 0 ? 0 : list.length - 1;
    } else {
      nextIndex = currentIndex + delta;
      if (nextIndex < 0) {
        nextIndex = loopFocus() ? list.length - 1 : 0;
      } else if (nextIndex >= list.length) {
        nextIndex = loopFocus() ? 0 : list.length - 1;
      }
    }
    setActiveId(list[nextIndex].id);
  };

  const focusFirst = () => {
    const list = enabledItems();
    setActiveId(list.length > 0 ? list[0].id : undefined);
  };

  const focusLast = () => {
    const list = enabledItems();
    setActiveId(list.length > 0 ? list[list.length - 1].id : undefined);
  };

  // 高亮项变化时滚动到可见区域
  createEffect(() => {
    const id = activeId();
    if (!id) return;
    orderedItems()
      .find((item) => item.id === id)
      ?.element.scrollIntoView({ block: "nearest" });
  });

  // 关闭时清空高亮与子菜单状态,保证下次打开重新从第一项开始。
  createEffect(() => {
    if (!options.open()) {
      setActiveIdInternal(undefined);
      setOpenPopupState(undefined);
    }
  });

  // --- 键盘字符导航 ---
  let typeaheadBuffer = "";
  let typeaheadTimer: number | undefined;

  const runTypeahead = (char: string) => {
    typeaheadBuffer += char.toLowerCase();
    if (typeaheadTimer !== undefined) window.clearTimeout(typeaheadTimer);
    typeaheadTimer = window.setTimeout(() => {
      typeaheadBuffer = "";
      typeaheadTimer = undefined;
    }, TYPEAHEAD_TIMEOUT);

    const match = enabledItems().find((item) =>
      item.label().toLowerCase().startsWith(typeaheadBuffer),
    );
    if (match) setActiveId(match.id);
  };

  onCleanup(() => {
    if (typeaheadTimer !== undefined) window.clearTimeout(typeaheadTimer);
  });

  const onKeyDown = (e: KeyboardEvent) => {
    const submenu = options.submenu;
    const horizontal = orientation() === "horizontal";

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveActive(-1);
        break;
      case "ArrowRight": {
        if (horizontal) {
          e.preventDefault();
          moveActive(1);
          break;
        }
        const entry = activeEntry();
        if (entry?.hasPopup()) {
          e.preventDefault();
          entry.openPopup?.("list-navigation", e);
        }
        break;
      }
      case "ArrowLeft": {
        if (horizontal) {
          e.preventDefault();
          moveActive(-1);
          break;
        }
        if (submenu) {
          e.preventDefault();
          // 阻止冒泡,避免父级浮层也处理这次按键
          e.stopPropagation();
          submenu.closeSubmenu("list-navigation", e, true);
        }
        break;
      }
      case "Home":
        e.preventDefault();
        focusFirst();
        break;
      case "End":
        e.preventDefault();
        focusLast();
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const entry = activeEntry();
        if (entry && !entry.disabled()) entry.activate();
        break;
      }
      case "Escape": {
        e.preventDefault();
        e.stopPropagation();
        if (submenu && !submenu.closeParentOnEsc()) {
          submenu.closeSubmenu("escape-key", e, true);
        } else {
          root.closeAll("escape-key", e);
        }
        break;
      }
      case "Tab": {
        // 关闭菜单并把焦点交还触发器,浏览器随后的 Tab 会从触发器之后继续
        e.preventDefault();
        root.closeAll("focus-out", e);
        break;
      }
      default: {
        if (
          e.key.length === 1 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          runTypeahead(e.key);
        }
      }
    }
  };

  const popupCtx: ContextMenuPopupContextValue = {
    root,
    parent: options.parent,
    menuId,
    isSubmenu: options.isSubmenu,
    popup: popupEl,
    setPopup: (el) => setPopupEl(el),
    items: orderedItems,
    registerItem,
    activeId,
    setActiveId,
    activeEntry,
    moveActive,
    focusFirst,
    focusLast,
    highlight: (id) => setActiveId(id),
    openPopupState,
    openPopup: (id, reason, event) =>
      setOpenPopupState({ id, reason, event }),
    closeOpenPopup,
    closeAll: (reason, event) => root.closeAll(reason, event),
    highlightItemOnHover,
  };

  /** 浮层挂载完成后的收尾:聚焦 popup(键盘事件依赖它)并高亮第一项 */
  const setupOnOpen = () => {
    queueMicrotask(() => {
      if (!options.open()) return;
      popupEl()?.focus({ preventScroll: true });
      if (activeId() === undefined) focusFirst();
    });
  };

  return {
    popupCtx,
    pos,
    popupEl,
    setPopupEl: (el) => setPopupEl(el),
    positionerEl,
    setPositionerEl: (el) => setPositionerEl(el),
    availableHeight,
    placement: pos.placement,
    onKeyDown,
    setupOnOpen,
  };
}
