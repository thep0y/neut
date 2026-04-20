import {
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from "solid-js";
import type { ScrollBarProps } from "./ScrollBar.types";
import { clsx } from "~/lib/utils";
import { useScrollAreaContext } from "../ScrollArea";

// Minimum thumb length in px so it's always clickable
const MIN_THUMB_PX = 20;

export const ScrollBar = (props: ScrollBarProps) => {
  const ctx = useScrollAreaContext();

  let trackEl!: HTMLDivElement;

  const merged = mergeProps({ orientation: "vertical" } as const, props);

  const [local, others] = splitProps(merged, [
    "orientation",
    "class",
    "classList",
  ]);

  const [active, setActive] = createSignal(false);
  const isVertical = () => local.orientation === "vertical";

  const metrics = createMemo(() =>
    isVertical() ? ctx.vertical() : ctx.horizontal(),
  );

  /**
   * Compute thumb CSS: we clamp to MIN_THUMB_PX, then shift the offset so the
   * thumb never overflows the track.
   */
  const thumbStyle = createMemo(() => {
    const m = metrics();

    const trackSize = isVertical()
      ? (trackEl?.clientHeight ?? 0)
      : (trackEl?.clientWidth ?? 0);

    const trackInnerSize = trackSize - 2; // track有内边距

    const rawThumbSize = trackInnerSize * m.thumbRatio;
    const thumbSize = Math.max(rawThumbSize, MIN_THUMB_PX);

    // Adjust offset to account for clamping
    const maxOffset = Math.max(0, trackInnerSize - thumbSize);
    const offset = maxOffset * m.thumbOffset;

    if (isVertical()) {
      return {
        height: `${thumbSize}px`,
        transform: `translateY(${offset}px)`,
      };
    }
    return {
      width: `${thumbSize}px`,
      transform: `translateX(${offset}px)`,
    };
  });

  // ARIA value: 0–100 integer representing scroll position
  const ariaValueNow = createMemo(() =>
    Math.round(metrics().thumbOffset * 100),
  );

  // ── Drag handling ─────────────────────────────────────────────────────────
  function onThumbPointerDown(e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();

    const viewport = ctx.viewportRef();
    if (!viewport) return;

    ctx.setDragging(local.orientation);
    setActive(true);

    const startPointer = isVertical() ? e.clientY : e.clientX;
    const startScroll = isVertical() ? viewport.scrollTop : viewport.scrollLeft;
    const maxScroll = isVertical()
      ? viewport.scrollHeight - viewport.clientHeight
      : viewport.scrollWidth - viewport.clientWidth;

    const trackSize = isVertical() ? trackEl.clientHeight : trackEl.clientWidth;
    const trackInnerSize = trackSize - 2; // track有内边距

    const thumbSize = isVertical()
      ? (e.currentTarget as HTMLDivElement).clientHeight
      : (e.currentTarget as HTMLDivElement).clientWidth;
    const scrollRatio = maxScroll / (trackInnerSize - thumbSize);

    function onMove(me: PointerEvent) {
      const delta = (isVertical() ? me.clientY : me.clientX) - startPointer;

      const newScroll = Math.max(
        0,
        Math.min(maxScroll, startScroll + delta * scrollRatio),
      );
      if (isVertical()) {
        viewport!.scrollTop = newScroll;
      } else {
        viewport!.scrollLeft = newScroll;
      }
    }

    function onUp() {
      ctx.setDragging(null);
      setActive(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    onCleanup(() => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    });
  }

  // ── Track click: page-scroll (click above/below thumb) ───────────────────
  function onTrackPointerDown(e: PointerEvent) {
    // Ignore if the target is the thumb itself
    if ((e.target as HTMLElement).dataset.slot === "scroll-area-thumb") return;

    const viewport = ctx.viewportRef();
    if (!viewport) return;

    const rect = trackEl.getBoundingClientRect();
    const clickPos = isVertical()
      ? (e.clientY - rect.top) / rect.height
      : (e.clientX - rect.left) / rect.width;

    const maxScroll = isVertical()
      ? viewport.scrollHeight - viewport.clientHeight
      : viewport.scrollWidth - viewport.clientWidth;

    const target = clickPos * maxScroll;

    viewport.scrollTo({
      [isVertical() ? "top" : "left"]: target,
      behavior: "smooth",
    });
  }

  // ── Keyboard scrolling on the scrollbar track ─────────────────────────────
  function onKeyDown(e: KeyboardEvent) {
    const viewport = ctx.viewportRef();
    if (!viewport) return;

    const step = 40; // px per keypress
    const pageSize = isVertical()
      ? viewport.clientHeight
      : viewport.clientWidth;

    const keyMap: Record<string, number> = {
      ArrowDown: step,
      ArrowRight: step,
      ArrowUp: -step,
      ArrowLeft: -step,
      PageDown: pageSize,
      PageUp: -pageSize,
      Home: -Infinity,
      End: Infinity,
    };

    const delta = keyMap[e.key];
    if (delta === undefined) return;

    e.preventDefault();

    if (isVertical()) {
      viewport.scrollTop = Math.max(
        0,
        Math.min(
          viewport.scrollHeight - viewport.clientHeight,
          delta === Infinity
            ? viewport.scrollHeight
            : delta === -Infinity
              ? 0
              : viewport.scrollTop + delta,
        ),
      );
    } else {
      viewport.scrollLeft = Math.max(
        0,
        Math.min(
          viewport.scrollWidth - viewport.clientWidth,
          delta === Infinity
            ? viewport.scrollWidth
            : delta === -Infinity
              ? 0
              : viewport.scrollLeft + delta,
        ),
      );
    }
  }

  // ── Visibility: show while hovering or dragging ───────────────────────────
  const visible = createMemo(
    () => ctx.hovering() || ctx.dragging() === props.orientation || active(),
  );

  return (
    <div
      ref={trackEl}
      data-slot="scroll-area-scrollbar"
      // WCAG 4.1.2: expose as scrollbar widget
      role="scrollbar"
      aria-controls="scroll-area-viewport"
      aria-orientation={local.orientation}
      aria-valuenow={ariaValueNow()}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onPointerDown={onTrackPointerDown}
      onKeyDown={onKeyDown}
      data-orientation={local.orientation}
      data-hovering={ctx.hovering() ? "" : undefined}
      class={clsx(
        // Layout
        "absolute touch-none select-none transition-opacity duration-150",
        // Opacity — visible on hover/drag, hidden otherwise
        visible() ? "opacity-100" : "opacity-0",
        // Axis-specific positioning & size
        isVertical()
          ? "right-0 top-0 h-full w-2.5 border-l border-l-transparent p-px flex flex-col"
          : "bottom-0 left-0 w-full h-2.5 border-t border-t-transparent p-px flex flex-row",
        // Keyboard focus ring
        "outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/70 dark:focus-visible:ring-neutral-500/70",
        local.class,
      )}
      {...others}
    >
      <div
        data-slot="scroll-area-thumb"
        onPointerDown={onThumbPointerDown}
        data-orientation={local.orientation}
        class={clsx(
          "relative rounded-full",
          // Thumb colour
          "bg-neutral-300 dark:bg-white/20",
          // Hover / active state
          "hover:bg-neutral-400 dark:hover:bg-white/30",
          active() ? "bg-neutral-500 dark:bg-white/40" : "",
          "transition-colors duration-100",
          // Ensure thumb is always reachable
          isVertical() ? "min-h-5 w-full" : "min-w-5 h-full",
        )}
        style={thumbStyle()}
      />
    </div>
  );
};
