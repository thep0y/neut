import { createSignal, type Accessor } from "solid-js";
import type { MessageScrollerProviderProps } from "./message-scroller.types";
import { AT_EDGE_TOLERANCE } from "./message-scroller.utils";

type EngineOptions = Required<Omit<MessageScrollerProviderProps, "children">>;

/**
 * 滚动模式。
 * - `following-bottom`：跟随实时边缘（新内容自动滚到底）
 * - `free-scrolling`：读者自己控制位置，内容变化不再抢滚动
 * - `anchored-to-message`：把某个锚点行固定在阅读线上（新回合锚定）
 * - `settling-jump`：一次显式跳转后的过渡态
 */
export type ScrollMode =
  | "following-bottom"
  | "free-scrolling"
  | "anchored-to-message"
  | "settling-jump";

/** 「滚动到最新」后 data-autoscrolling 的持续时间（ms） */
const AUTO_SCROLLING_TIMEOUT_MS = 180;

export interface ScrollStateOptions {
  viewport: Accessor<HTMLElement | undefined>;
  options: () => EngineOptions;
  /** 内容底部（不含 spacer），由 `dom-measure` 提供 */
  contentBottom: () => number;
}

export interface ScrollState {
  /** 是否处于"跟随实时边缘"（迁移一律走下面的语义化方法，避免散落的直接赋值） */
  isFollowing: () => boolean;
  isAnchored: () => boolean;
  /** 是否可向两侧滚动（注意：跟随时对外把 `end` 强制为 false） */
  scrollableStart: Accessor<boolean>;
  scrollableEnd: Accessor<boolean>;
  autoscrolling: Accessor<boolean>;

  setFollowing: () => void;
  setFree: () => void;
  anchorTo: () => void;
  settleJump: () => void;

  /** 立即计算可滚动状态并按当前位置迁移模式 */
  commit: () => void;
  /** 分帧提交（滚动热路径） */
  schedule: () => void;
  /** 开启「正在自动滚动」态，到期自动复位 */
  beginAutoScroll: () => void;
  /** 关闭该状态并清掉计时器 */
  endAutoScroll: () => void;
  /** 滚轮/触摸/键盘滚动：立刻把位置交还读者 */
  releaseFollow: () => void;
  dispose: () => void;
}

/**
 * 滚动状态机。
 *
 * 单一职责：维护滚动模式与"能否向两侧滚动""是否正在自动滚动"这三个对外状态，
 * 并按测量结果迁移模式。它不写 `scrollTop`、不做锚定决策——那些是 commands /
 * anchoring 的事；本模块只回答"现在是什么模式"。
 *
 * `mode` 的**唯一写入者**是本模块：外部只能通过 `setFollowing` / `setFree` /
 * `anchorTo` / `settleJump` 表达意图，`releaseFollow` 与滚动事件带来的迁移
 * 也收在这里，避免"多个模块各自记住模式"的隐性耦合。
 */
export function createScrollState(options: ScrollStateOptions): ScrollState {
  const [scrollableStart, setScrollableStart] = createSignal(false);
  const [scrollableEnd, setScrollableEnd] = createSignal(false);
  const [autoscrolling, setAutoscrolling] = createSignal(false);

  let mode: ScrollMode = options.options().autoScroll
    ? "following-bottom"
    : "free-scrolling";
  let lastScrollTop = 0;
  let autoscrollingTimer: number | null = null;
  let stateFrame: number | null = null;

  const computeScrollable = () => {
    const viewport = options.viewport();
    if (!viewport) return { start: false, end: false };

    const threshold = options.options().scrollEdgeThreshold;
    const bottom = options.contentBottom();
    return {
      start: viewport.scrollTop > threshold,
      end: bottom - viewport.scrollTop - viewport.clientHeight > threshold,
    };
  };

  /** 按当前位置与内容状态迁移模式（滚轮/触摸等意图由 releaseFollow 处理） */
  const updateModeFromScroll = (state: { start: boolean; end: boolean }) => {
    const viewport = options.viewport();
    if (!viewport) return;

    const top = viewport.scrollTop;
    const movedUp = top < lastScrollTop - AT_EDGE_TOLERANCE;
    lastScrollTop = top;

    if (
      options.options().autoScroll &&
      !state.end &&
      mode !== "settling-jump" &&
      mode !== "anchored-to-message"
    ) {
      mode = "following-bottom";
    } else if (
      mode === "following-bottom" &&
      state.end &&
      movedUp &&
      !autoscrolling()
    ) {
      // 读者主动往回滚：交出控制权
      mode = "free-scrolling";
    }
  };

  const commit = () => {
    const state = computeScrollable();
    updateModeFromScroll(state);
    // 跟随输出时对 UI 隐藏「还能向下滚」——按钮不出现，直到读者回到实时边缘
    const exposed =
      mode === "following-bottom" ? { ...state, end: false } : state;
    setScrollableStart(exposed.start);
    setScrollableEnd(exposed.end);
  };

  const schedule = () => {
    if (stateFrame !== null) return;
    stateFrame = window.requestAnimationFrame(() => {
      stateFrame = null;
      commit();
    });
  };

  const endAutoScroll = () => {
    if (autoscrollingTimer !== null) {
      window.clearTimeout(autoscrollingTimer);
      autoscrollingTimer = null;
    }
    // 与 beginAutoScroll 对称：值真的变了才提交一次状态
    if (autoscrolling()) {
      setAutoscrolling(false);
      commit();
    }
  };

  const beginAutoScroll = () => {
    if (autoscrollingTimer !== null) {
      window.clearTimeout(autoscrollingTimer);
      autoscrollingTimer = null;
    }
    if (!autoscrolling()) {
      setAutoscrolling(true);
      commit();
    }
    autoscrollingTimer = window.setTimeout(() => {
      autoscrollingTimer = null;
      setAutoscrolling(false);
      commit();
    }, AUTO_SCROLLING_TIMEOUT_MS);
  };

  return {
    isFollowing: () => mode === "following-bottom",
    isAnchored: () => mode === "anchored-to-message",
    scrollableStart,
    scrollableEnd,
    autoscrolling,
    setFollowing() {
      mode = "following-bottom";
    },
    setFree() {
      mode = "free-scrolling";
    },
    anchorTo() {
      mode = "anchored-to-message";
    },
    settleJump() {
      mode = "settling-jump";
    },
    commit,
    schedule,
    beginAutoScroll,
    endAutoScroll,
    releaseFollow() {
      // 只有"还在跟随/锚定/过渡"时才需要让位；已经自由滚动就不动
      if (
        mode === "following-bottom" ||
        mode === "anchored-to-message" ||
        mode === "settling-jump"
      ) {
        endAutoScroll();
        mode = "free-scrolling";
      }
    },
    dispose() {
      if (autoscrollingTimer !== null) {
        window.clearTimeout(autoscrollingTimer);
        autoscrollingTimer = null;
      }
      if (stateFrame !== null) {
        window.cancelAnimationFrame(stateFrame);
        stateFrame = null;
      }
    },
  };
}
