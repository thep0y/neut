import { createSignal, onCleanup, onMount, splitProps } from "solid-js";
import type { ScrollAreaProps, ScrollMetrics } from "./ScrollArea.types";
import { clsx } from "~/lib/utils";
import { ScrollBar } from "../ScrollBar";
import { ScrollAreaContext } from "./ScrollArea.context";
import { computeMetrics } from "./ScrollArea.utils";

export const ScrollArea = (props: ScrollAreaProps) => {
  let viewportEl!: HTMLDivElement;

  const [local, others] = splitProps(props, [
    "orientation",
    "class",
    "classList",
    "children",
    "aria-label",
  ]);

  const [hovering, setHovering] = createSignal(false);
  const [dragging, setDragging] = createSignal<
    "vertical" | "horizontal" | null
  >(null);

  const [verticalMetrics, setVerticalMetrics] = createSignal<ScrollMetrics>({
    thumbRatio: 1,
    thumbOffset: 0,
    scrollable: false,
  });
  const [horizontalMetrics, setHorizontalMetrics] = createSignal<ScrollMetrics>(
    {
      thumbRatio: 1,
      thumbOffset: 0,
      scrollable: false,
    },
  );
  function updateMetrics() {
    const el = viewportEl;
    if (!el) return;
    setVerticalMetrics(
      computeMetrics(el.clientHeight, el.scrollTop, el.scrollHeight),
    );
    setHorizontalMetrics(
      computeMetrics(el.clientWidth, el.scrollLeft, el.scrollWidth),
    );
  }

  onMount(() => {
    updateMetrics();

    // Watch content / viewport size changes
    const ro = new ResizeObserver(updateMetrics);
    ro.observe(viewportEl);

    // Also observe the first child (content wrapper) if present
    if (viewportEl.firstElementChild) {
      ro.observe(viewportEl.firstElementChild);
    }

    viewportEl.addEventListener("scroll", updateMetrics, { passive: true });

    onCleanup(() => {
      ro.disconnect();
      viewportEl.removeEventListener("scroll", updateMetrics);
    });
  });

  return (
    <div
      data-slot="scroll-area"
      class={clsx("relative", local.class)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      {...others}
    >
      <ScrollAreaContext.Provider
        value={{
          hovering,
          viewportRef: () => viewportEl,
          dragging,
          setDragging,
          vertical: verticalMetrics,
          horizontal: horizontalMetrics,
        }}
      >
        <div
          ref={viewportEl}
          data-slot="scroll-area-viewport"
          role="region"
          aria-label={local["aria-label"] ?? "Scrollable content"}
          class={clsx(
            // "size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-neutral-400/50 dark:focus-visible:ring-neutral-500/50 focus-visible:outline-1",
            // "overflow-scroll",
            // "[scrollbar-width:none]",
            "size-full rounded-[inherit] outline-none",
            // Native scrollbars hidden via CSS; custom ones provided below
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            // Focus ring — meets WCAG 2.4.7
            "focus-visible:ring-2 focus-visible:ring-offset-1",
            "focus-visible:ring-neutral-400/70 dark:focus-visible:ring-neutral-500/70",
            // Overflow based on which scrollbars are active
            local.orientation === "vertical"
              ? "overflow-y-scroll overflow-x-hidden"
              : local.orientation === "horizontal"
                ? "overflow-x-scroll overflow-y-hidden"
                : "overflow-scroll",
          )}
        >
          {local.children}
        </div>
        <ScrollBar orientation={local.orientation} />
      </ScrollAreaContext.Provider>
    </div>
  );
};
