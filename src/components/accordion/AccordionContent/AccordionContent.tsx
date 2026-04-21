import {
  createEffect,
  createSignal,
  on,
  Show,
  splitProps,
  untrack,
} from "solid-js";
import { clsx } from "~/lib/utils";
import { useAccordionContext } from "../Accordion/Accordion.context";
import { useAccordionItemContext } from "../AccordionItem/AccordionItem.context";
import type { AccordionContentProps } from "./AccordionContent.types";

export const AccordionContent = (props: AccordionContentProps) => {
  const { orientation } = useAccordionContext();
  const { triggerId, open, contentId } = useAccordionItemContext();

  const [local, others] = splitProps(props, [
    "hiddenUntilFound",
    "keepMounted",
    "class",
    "classList",
    "children",
    "style",
  ]);

  // 控制 DOM 是否存在，用untrack避免追踪open变化
  const [mounted, setMounted] = createSignal(untrack(open));
  // 记录测量到的真实高度
  const [panelHeight, setPanelHeight] = createSignal<number | null>(null);

  let contentRef: HTMLDivElement | undefined;

  createEffect(
    on(open, (isOpen) => {
      if (isOpen) {
        setMounted(true);
      }
    }),
  );

  // 挂载后测量高度
  createEffect(() => {
    if (mounted() && contentRef) {
      // 临时让内容可见以测量真实高度
      setPanelHeight(contentRef.scrollHeight);
    }
  });

  const handleAnimationEnd = (e: AnimationEvent) => {
    if (!open() && e.animationName === "accordion-up") {
      setMounted(false);
      setPanelHeight(null);
    }
  };

  return (
    <Show when={mounted()}>
      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        class="overflow-hidden text-sm data-[open=true]:animate-accordion-down data-[open=false]:animate-accordion-up"
        data-slot="accordion-content"
        data-orientation={orientation}
        data-open={open() ? "true" : "false"}
        style={{
          "--accordion-panel-height":
            panelHeight() !== null ? `${panelHeight()}px` : "auto",
        }}
        onAnimationEnd={handleAnimationEnd}
        {...others}
      >
        <div
          ref={contentRef}
          class={clsx(
            "pb-2.5 pt-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
            local.class,
          )}
        >
          {local.children}
        </div>
      </div>
    </Show>
  );
};
