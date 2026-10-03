import type { Accessor } from "solid-js";
import type { DomMeasure } from "./message-scroller.dom-measure";
import { rowGap } from "./message-scroller.measure";
import type { ScrollState } from "./message-scroller.scroll-state";
import { targetTopFor as computeTargetTopFor } from "./message-scroller.scroll-target";
import type {
  MessageScrollerProviderProps,
  MessageScrollerScrollOptions,
} from "./message-scroller.types";
import { AT_EDGE_TOLERANCE } from "./message-scroller.utils";

type EngineOptions = Required<Omit<MessageScrollerProviderProps, "children">>;

/**
 * 滚动命令与尾部 spacer。
 *
 * 单一职责：把"滚到哪里"变成一次 `scrollTop` 写入，并按需设置尾部 spacer
 * （让靠近结尾的行也能滚到顶部）。模式的迁移通过 `ScrollState` 的语义化方法
 * 表达；锚定状态（prependAnchor / streamingTurn）不在本模块里，由调用方
 * （anchoring）在命令返回后自行记录。
 *
 * `setScrollTop` 的两条路径对应上游语义：位移在容差内就直接赋值（避免一次毫无
 * 意义的滚动动画），否则交给浏览器滚动并在下一帧提交状态。
 */
export interface ScrollCommandsOptions {
  viewport: Accessor<HTMLElement | undefined>;
  content: Accessor<HTMLElement | undefined>;
  /** 尾部 spacer 元素（信号由引擎持有，与 `dom-measure` 共用） */
  spacer: Accessor<HTMLElement | undefined>;
  options: () => EngineOptions;
  measure: DomMeasure;
  state: ScrollState;
  /** 同步一次可见性（滚动后阅读行会变） */
  scheduleVisibility: () => void;
}

export interface ScrollCommands {
  spacerHeight: () => number;
  setScrollTop: (
    top: number,
    options?: { behavior?: ScrollBehavior; auto?: boolean },
  ) => void;
  /** 计算"滚到某一行"的目标位置（供外部换算，如初始定位的放得下判断） */
  targetTopFor: (
    element: HTMLElement,
    command: MessageScrollerScrollOptions | undefined,
    margin: number,
  ) => number;
  scrollToStart: (command?: MessageScrollerScrollOptions) => boolean;
  scrollToEnd: (command?: MessageScrollerScrollOptions) => boolean;
  scrollToElement: (
    element: HTMLElement,
    command?: MessageScrollerScrollOptions,
    options?: { keepPreviousPeek?: boolean },
  ) => boolean;
}

export function createScrollCommands(
  options: ScrollCommandsOptions,
): ScrollCommands {
  let spacerHeightValue = 0;

  /**
   * 行间距在**用到时**才读：ref 回调可能早于元素插入文档，
   * 而游离节点在部分环境（jsdom）读计算样式会抛错；
   * 真正要写 spacer 高度时树一定已经挂好，此时读到的才是有效值。
   */
  const spacerGap = () => rowGap(options.spacer()?.parentElement ?? null);

  /** 设置尾部 spacer：让目标行有空间滚到指定位置；0 时隐藏 */
  const setSpacerHeight = (height: number) => {
    const spacer = options.spacer();
    if (!spacer) return;

    const next = Math.max(0, Math.ceil(height));
    if (spacerHeightValue === next) return;

    spacerHeightValue = next;
    spacer.hidden = next === 0;
    spacer.style.height = `${next}px`;
    // 用负 margin 抵消内容的行间距，否则 spacer 会多出一段空隙
    spacer.style.marginTop = next > 0 ? `${-spacerGap()}px` : "";
  };

  const setScrollTop: ScrollCommands["setScrollTop"] = (
    top,
    { behavior = "auto", auto = false } = {},
  ) => {
    const viewport = options.viewport();
    if (!viewport) return;

    const next = Math.max(0, top);
    if (Math.abs(viewport.scrollTop - next) <= AT_EDGE_TOLERANCE) {
      // 已经在目标位置：直接落位，不做动画
      viewport.scrollTop = next;
      options.state.commit();
      return;
    }
    if (auto) options.state.beginAutoScroll();
    viewport.scrollTo({ top: next, behavior });
    options.state.schedule();
  };

  const targetTopFor: ScrollCommands["targetTopFor"] = (
    element,
    command,
    margin,
  ) => {
    const viewport = options.viewport();
    if (!viewport) return 0;
    return computeTargetTopFor(
      element,
      command,
      margin,
      viewport,
      options.content(),
      options.measure.itemOffsetTop,
    );
  };

  return {
    spacerHeight: () => spacerHeightValue,
    setScrollTop,
    targetTopFor,
    scrollToStart(command) {
      if (!options.viewport()) return false;
      setSpacerHeight(0);
      options.state.setFree();
      setScrollTop(0, { behavior: command?.behavior ?? "auto" });
      options.scheduleVisibility();
      return true;
    },
    scrollToEnd(command) {
      if (!options.viewport()) return false;
      setSpacerHeight(0);
      if (options.options().autoScroll) options.state.setFollowing();
      else options.state.setFree();
      setScrollTop(options.measure.maxScrollTop(), {
        behavior: command?.behavior ?? "auto",
        auto: true,
      });
      options.scheduleVisibility();
      return true;
    },
    scrollToElement(element, command, { keepPreviousPeek = false } = {}) {
      const viewport = options.viewport();
      const content = options.content();
      if (!viewport || !content?.contains(element)) return false;

      const margin =
        (command?.scrollMargin ?? options.options().scrollMargin) +
        (keepPreviousPeek ? options.options().scrollPreviousItemPeek : 0);
      const target = targetTopFor(element, command, margin);
      // 让目标行有足够空间滚到目标位置（内容不够高时补一段 spacer）
      setSpacerHeight(
        Math.max(
          0,
          target + viewport.clientHeight - options.measure.contentBottom(),
        ),
      );

      if (keepPreviousPeek) options.state.anchorTo();
      else options.state.settleJump();

      setScrollTop(target, { behavior: command?.behavior ?? "auto" });
      options.scheduleVisibility();
      return true;
    },
  };
}
