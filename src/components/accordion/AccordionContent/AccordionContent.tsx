import {
  createEffect,
  createSignal,
  onCleanup,
  Show,
  splitProps,
} from "solid-js";
import type { AccordionContentProps } from "./AccordionContent.types";
import { clsx } from "~/lib/utils";
import { useAccordionContext } from "../Accordion/Accordion.context";
import { useAccordionItemContext } from "../AccordionItem/AccordionItem.context";

export const AccordionContent = (props: AccordionContentProps) => {
  const { orientation } = useAccordionContext();
  const { index, open } = useAccordionItemContext();

  const [local, others] = splitProps(props, [
    "hiddenUntilFound",
    "keepMounted",
    "class",
    "classList",
    "children",
    "style",
  ]);

  // 控制 DOM 是否存在（延迟卸载，等关闭动画完成）
  const [mounted, setMounted] = createSignal(open());
  // 记录测量到的真实高度
  const [panelHeight, setPanelHeight] = createSignal<number | null>(null);

  let contentRef: HTMLDivElement | undefined;
  let outerRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (open()) {
      // 打开：先挂载 DOM
      setMounted(true);
    }
    // 关闭时不立即卸载，等 animationend
  });

  // 挂载后测量高度
  createEffect(() => {
    if (mounted() && contentRef) {
      // 临时让内容可见以测量真实高度
      const height = contentRef.scrollHeight;
      setPanelHeight(height);
    }
  });

  // 监听关闭动画结束 → 卸载
  createEffect(() => {
    if (!open() && outerRef) {
      const el = outerRef;

      const handleAnimationEnd = (e: AnimationEvent) => {
        // 只处理 accordion-up 动画结束
        if (e.animationName === "accordion-up") {
          setMounted(false);
          setPanelHeight(null);
        }
      };

      el.addEventListener("animationend", handleAnimationEnd);
      onCleanup(() =>
        el.removeEventListener("animationend", handleAnimationEnd),
      );
    }
  });

  return (
    <Show when={mounted()}>
      <div
        ref={outerRef}
        class="overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up"
        data-slot="accordion-content"
        data-orientation={orientation}
        data-open={open() ? "" : null}
        data-closed={open() ? null : ""}
        data-index={index}
        style={{
          "--accordion-panel-height": panelHeight()
            ? `${panelHeight()}px`
            : "auto",
        }}
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
