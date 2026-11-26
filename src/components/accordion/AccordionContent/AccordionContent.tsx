import {
  createEffect,
  createSignal,
  on,
  Show,
  splitProps,
  untrack,
} from "solid-js";
import { clsx } from "~/utils";
import { useAccordionContext } from "../Accordion/Accordion.context";
import { useAccordionItemContext } from "../AccordionItem/AccordionItem.context";
import type { AccordionContentProps } from "./AccordionContent.types";
import s from "./AccordionContent.styles";

export const AccordionContent = (props: AccordionContentProps) => {
  const { orientation } = useAccordionContext();
  const { triggerId, open, contentId } = useAccordionItemContext();
  const {
    keepMounted: rootKeepMounted,
    hiddenUntilFound: rootHiddenUntilFound,
  } = useAccordionContext();

  const [local, others] = splitProps(props, [
    "hiddenUntilFound",
    "keepMounted",
    "class",
    "classList",
    "children",
    "style",
  ]);

  const keepMounted = () => local.keepMounted ?? rootKeepMounted();
  const hiddenUntilFound = () =>
    local.hiddenUntilFound ?? rootHiddenUntilFound();
  // hidden=until-found 需要内容留在 DOM 里，关闭时由浏览器隐藏。
  const keepContent = () => keepMounted() || hiddenUntilFound();

  // 控制 DOM 是否存在，用untrack避免追踪open变化
  const [mounted, setMounted] = createSignal(untrack(open) || keepContent());
  // 记录测量到的真实高度
  const [panelHeight, setPanelHeight] = createSignal<number | null>(null);

  let contentRef: HTMLDivElement | undefined;
  let panelRef: HTMLDivElement | undefined;

  // Solid 会把 hidden 的字符串值归一成布尔属性，until-found 必须手写。
  const syncHidden = (el: HTMLDivElement) => {
    if (open()) {
      el.removeAttribute("hidden");
    } else if (hiddenUntilFound()) {
      el.setAttribute("hidden", "until-found");
    } else {
      el.setAttribute("hidden", "");
    }
  };

  createEffect(() => {
    if (!mounted()) return;
    syncHidden(panelRef!);
  });

  createEffect(
    on(open, (isOpen) => {
      if (isOpen) {
        setMounted(true);
      }
    }),
  );

  // keepMounted 可能在挂载后才变为 true，同样需要把内容留在 DOM 里。
  createEffect(() => {
    if (keepContent()) setMounted(true);
  });

  // 挂载后测量高度
  createEffect(() => {
    if (mounted() && contentRef) {
      // 临时让内容可见以测量真实高度
      setPanelHeight(contentRef.scrollHeight);
    }
  });

  const handleAnimationEnd = (e: AnimationEvent) => {
    if (!open() && e.animationName === "accordion-up" && !keepContent()) {
      setMounted(false);
      setPanelHeight(null);
    }
  };

  return (
    <Show when={mounted()}>
      <div
        ref={(el) => {
          panelRef = el;
          syncHidden(el);
        }}
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        class={s.content}
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
          class={clsx(s.wrapper, local.class)}
          classList={local.classList}
        >
          {local.children}
        </div>
      </div>
    </Show>
  );
};
