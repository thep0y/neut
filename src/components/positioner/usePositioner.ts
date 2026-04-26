// usePositioner.ts
import { createEffect, createSignal, onCleanup, type JSX } from "solid-js";
import type {
  PositionerProps,
  RequiredPositionerProps,
} from "./Positioner.types";
import {
  getAbsoluteOffsetTop,
  getClippingRect,
  normalizePadding,
} from "./Positioner.utils";
import {
  computeAnchorPosition,
  computeNormalPosition,
} from "./Positioner.position";
import { applyOverflowCorrection } from "./Positioner.overflow";
import { MEASURING_STYLE } from "./Positioner.consts";

export const usePositioner = ({
  props,
}: {
  props: RequiredPositionerProps &
    Pick<
      PositionerProps,
      "triggerRef" | "style" | "open" | "anchorRef" | "boundary"
    >;
}) => {
  const [floatingRef, setFloatingRef] = createSignal<HTMLDivElement>();
  const [floatingStyle, setFloatingStyle] =
    createSignal<JSX.CSSProperties>(MEASURING_STYLE);

  // ── 核心定位计算 ─────────────────────────────────────────────────────────────

  function measure() {
    const el = floatingRef();
    if (!el || !props.triggerRef) return;

    const triggerRect = props.triggerRef.getBoundingClientRect();
    const floatingRect = el.getBoundingClientRect();
    const padding = normalizePadding(props.boundaryPadding);
    const clip = getClippingRect(props.triggerRef, props.boundary, padding);

    // ── Step 1：计算理想位置 ──────────────────────────────────────────────────

    let initial: { top: number; left: number; width?: number; height?: number };

    if (props.anchorRef) {
      const { top, left } = computeAnchorPosition(
        triggerRect,
        el,
        props.anchorRef,
        props.anchorSide,
        props.anchorAlign,
      );
      initial = { top, left };
    } else {
      initial = computeNormalPosition(
        triggerRect,
        {
          top: floatingRect.top,
          left: floatingRect.left,
          width: floatingRect.width,
          height: floatingRect.height,
        },
        {
          side: props.side,
          sideOffset: props.sideOffset,
          align: props.align,
          alignOffset: props.alignOffset,
          alignItemWithTrigger: props.alignItemWithTrigger,
        },
      );
    }

    // ── Step 2：边界约束 ──────────────────────────────────────────────────────

    const corrected = applyOverflowCorrection(
      initial,
      {
        top: floatingRect.top,
        left: floatingRect.left,
        width: floatingRect.width,
        height: floatingRect.height,
      },
      triggerRect,
      clip,
      props.side,
      props.sideOffset,
      props.overflowStrategy,
    );

    // ── Step 3：anchorRef 溢出检测与定位策略 ─────────────────────────────────
    //
    // 关键：溢出检测和 height 计算全部使用 offset* 相对坐标（不依赖浮层 viewport 位置），
    // 因此在 Show 挂载后的第一帧（浮层在 top:0/left:0）即可得到正确结果。
    //
    // Bug 修复（原始代码）：
    //   原来直接用 props.anchorRef.offsetTop，这只是相对直接 offsetParent 的距离。
    //   若 anchorEl 被多层元素包裹（如 li → ul → 浮层），offsetTop 只得到 li 相对 ul 的偏移，
    //   而非相对浮层的偏移，导致 itemTop 偏小，idealTop 偏大，锚点无法正确对齐。
    //   修复：改用 getAbsoluteOffsetTop 沿 offsetParent 链累加到浮层根节点。

    const isAnchorMode = !!props.anchorRef;
    const isVerticalAnchor =
      props.anchorSide === "top" || props.anchorSide === "bottom";

    const marginStyle: JSX.CSSProperties = {};
    if (isAnchorMode && props.sideOffset) {
      if (isVerticalAnchor) {
        marginStyle["margin-top"] = `${props.sideOffset}px`;
        marginStyle["margin-bottom"] = `${props.sideOffset}px`;
      } else {
        marginStyle["margin-left"] = `${props.sideOffset}px`;
        marginStyle["margin-right"] = `${props.sideOffset}px`;
      }
    }

    let positionProps: JSX.CSSProperties;

    if (isAnchorMode && isVerticalAnchor && props.anchorRef) {
      // 修复：使用 getAbsoluteOffsetTop 代替 props.anchorRef.offsetTop，
      // 确保多层嵌套时也能正确计算 anchorEl 相对浮层根节点的偏移。
      const itemTop = getAbsoluteOffsetTop(props.anchorRef, el) - el.clientTop;
      const idealTop = triggerRect.top - itemTop;
      const clipBottom = clip.top + clip.height;

      if (idealTop < clip.top) {
        // ── 溢出：top 夹紧到 clip.top，height 填满可用空间 ──────────────────
        //
        // 问题根因（原来用 bottom:"0px" + 大 height）：
        //   bottom:0 是相对 viewport 底部，height 很大时浮层顶边 = vh - height < 0，
        //   浮层大幅超出视口顶部，anchorEl 所在区域进入不可见区域。
        //
        // 正确策略：
        //   - 把浮层顶部夹紧到 clip.top（不溢出顶部边界）
        //   - height = clipBottom - clip.top（撑满整个可用空间）
        //   - anchorEl 在浮层内的 itemTop 超出可视区域（在 clip.top 之上）是预期行为，
        //     浮层内的滚动容器会截断，用户看到的是可视区域内的内容
        //
        // 与「不溢出」分支保持一致，全程用 top 定位，不依赖 body 高度。
        const height = clipBottom - clip.top;

        positionProps = {
          top: `${clip.top}px`,
          left: `${corrected.left}px`,
          height: `${Math.max(0, height)}px`,
        };
      } else {
        positionProps = {
          top: `${idealTop}px`,
          left: `${corrected.left}px`,
        };
      }
    } else {
      positionProps = {
        top: `${corrected.top}px`,
        left: `${corrected.left}px`,
        ...(corrected.width != null ? { width: `${corrected.width}px` } : {}),
        ...(corrected.height != null
          ? { height: `${corrected.height}px` }
          : {}),
        ...(corrected.maxWidth != null
          ? { "max-width": `${corrected.maxWidth}px` }
          : {}),
        ...(corrected.maxHeight != null
          ? { "max-height": `${corrected.maxHeight}px` }
          : {}),
      };
    }

    setFloatingStyle({
      position: "fixed",
      ...positionProps,
      ...marginStyle,
      "--anchor-width": `${triggerRect.width}px`,
      "--anchor-height": `${triggerRect.height}px`,
      "--available-width": `${corrected.availableWidth}px`,
      "--available-height": `${corrected.availableHeight}px`,
      ...props.style,
    } as JSX.CSSProperties);

    el.dataset.side = corrected.resolvedSide;
    el.dataset.align = props.align;
  }

  // ── 定位测量 + 响应式更新 ────────────────────────────────────────────────────
  //
  // 【Bug 修复】原来用 onMount 触发首次测量，但 usePositioner 在 <Show> 外部初始化，
  // onMount 在 Positioner 组件自身挂载时执行，此时 open 可能为 false，Show 尚未渲染
  // 子树，floatingRef() 为 undefined，measure() 直接 return，首次打开无效。
  //
  // 修复：改为用 createEffect 追踪 floatingRef() 信号。
  //   open=false → Show 不渲染 → floatingRef()=undefined → effect 等待
  //   open=true  → Show 渲染 → ref 回调写入 → floatingRef() 变化 → effect 重新运行
  //             → MEASURING_STYLE 重置 → rAF(measure) 完成首次定位
  //
  // 同一个 effect 同时追踪所有影响定位的 props，anchorRef 切换或 props 变化时也统一走此路径。

  createEffect(() => {
    void props.side;
    void props.sideOffset;
    void props.align;
    void props.alignOffset;
    void props.alignItemWithTrigger;
    void props.anchorSide;
    void props.anchorAlign;
    void props.boundary;
    void props.boundaryPadding;
    void props.overflowStrategy;
    void props.anchorRef;
    void props.triggerRef;

    const floatingEl = floatingRef(); // 追踪 DOM 出现/消失
    if (!floatingEl || !props.triggerRef) return;

    // 重置为测量初始状态，确保每次从干净状态开始（opacity:0 避免闪烁）
    setFloatingStyle(MEASURING_STYLE);
    // 等待浏览器完成 layout 后再读取 offsetTop / getBoundingClientRect
    requestAnimationFrame(measure);
  });

  // ── 事件监听（ResizeObserver + scroll/resize）────────────────────────────────
  //
  // 同样追踪 floatingRef()，确保监听器在 DOM 真正出现后才绑定，消失后自动清理。

  createEffect(() => {
    const el = floatingRef();
    if (!el) return;

    const ro = new ResizeObserver(measure);
    if (props.triggerRef) ro.observe(props.triggerRef);
    if (props.anchorRef) ro.observe(props.anchorRef);
    ro.observe(el);
    if (props.boundary instanceof HTMLElement) ro.observe(props.boundary);

    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);

    onCleanup(() => {
      ro.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    });
  });

  return { ref: setFloatingRef, style: floatingStyle };
};
