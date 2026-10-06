import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { MessageScrollerViewport } from "~/components/message-scroller/MessageScrollerViewport/MessageScrollerViewport";
import {
  contextWrapper,
  fakeContext,
} from "~tests/components/message-scroller/test-utils";

/**
 * 可滚动元素：默认是键盘可达、有标签的 `role="region"`，
 * 并把自身注册给引擎（viewport）、同步可滚动/遮罩状态、转发 ref。
 */
function renderViewport(
  props: Parameters<typeof MessageScrollerViewport>[0] = {},
  overrides: Parameters<typeof fakeContext>[0] = {},
) {
  return render(() => <MessageScrollerViewport {...props} />, {
    wrapper: contextWrapper(fakeContext(overrides)),
  });
}

function viewportOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="message-scroller-viewport"]');
}

describe("MessageScrollerViewport - 结构", () => {
  it("渲染一个带 data-slot 的 div", () => {
    const { container } = renderViewport();

    expect(viewportOf(container)?.tagName).toBe("DIV");
  });

  it("合并布局类名与外部 class", () => {
    const { container } = renderViewport({ class: "my-viewport" });

    expect(viewportOf(container)?.className).toContain("scroll-fade-b");
    expect(viewportOf(container)?.className).toContain("my-viewport");
  });

  it("应用 classList", () => {
    const { container } = renderViewport({
      classList: { "is-scrolling": true },
    });

    expect(viewportOf(container)?.className).toContain("is-scrolling");
  });

  it("透传其余属性（PolymorphicProps 的其余原生属性）", () => {
    const { container } = renderViewport({
      id: "vp",
      dir: "rtl",
      style: { "border-color": "red" },
    });

    expect(viewportOf(container)?.id).toBe("vp");
    expect(viewportOf(container)?.getAttribute("dir")).toBe("rtl");
    expect(viewportOf(container)?.style.borderColor).toBe("red");
  });
});

describe("MessageScrollerViewport - 无障碍默认值", () => {
  it("默认是 region + tabindex=0 + 英文标签", () => {
    const { container } = renderViewport();
    const element = viewportOf(container);

    expect(element?.getAttribute("role")).toBe("region");
    expect(element?.getAttribute("aria-label")).toBe("Messages");
    expect(element?.getAttribute("tabindex")).toBe("0");
  });

  it("role / aria-label / tabIndex 可被覆盖", () => {
    const { container } = renderViewport({
      role: "group",
      "aria-label": "聊天记录",
      tabIndex: -1,
    });
    const element = viewportOf(container);

    expect(element?.getAttribute("role")).toBe("group");
    expect(element?.getAttribute("aria-label")).toBe("聊天记录");
    expect(element?.getAttribute("tabindex")).toBe("-1");
  });
});

describe("MessageScrollerViewport - 状态属性", () => {
  it("可滚动状态映射成 data-scrollable", () => {
    const { container } = renderViewport(
      {},
      { scrollableStart: () => true, scrollableEnd: () => true },
    );

    expect(viewportOf(container)?.getAttribute("data-scrollable")).toBe(
      "start end",
    );
  });

  it("不可滚时属性缺失", () => {
    const { container } = renderViewport();

    expect(viewportOf(container)?.hasAttribute("data-scrollable")).toBe(false);
  });

  it("autoscrolling / pendingScroll 输出空值属性，为假时缺失", () => {
    const on = renderViewport(
      {},
      { autoscrolling: () => true, pendingScroll: () => true },
    );
    expect(viewportOf(on.container)?.getAttribute("data-autoscrolling")).toBe(
      "",
    );
    expect(viewportOf(on.container)?.getAttribute("data-pending-scroll")).toBe(
      "",
    );

    const off = renderViewport();
    expect(viewportOf(off.container)?.hasAttribute("data-autoscrolling")).toBe(
      false,
    );
    expect(viewportOf(off.container)?.hasAttribute("data-pending-scroll")).toBe(
      false,
    );
  });

  it("状态翻转后属性跟着变", () => {
    const [end, setEnd] = createSignal(false);
    const { container } = renderViewport({}, { scrollableEnd: end });
    const element = viewportOf(container);

    expect(element?.hasAttribute("data-scrollable")).toBe(false);
    setEnd(true);
    expect(element?.getAttribute("data-scrollable")).toBe("end");
  });
});

describe("MessageScrollerViewport - 与引擎的接线", () => {
  it("挂载时把自己注册为 viewport，卸载时清空", () => {
    const setViewport = vi.fn();
    const { container, unmount } = renderViewport({}, { setViewport });
    const element = viewportOf(container);

    expect(setViewport).toHaveBeenCalledWith(element);

    unmount();
    expect(setViewport).toHaveBeenLastCalledWith(undefined);
  });

  it("把 preserveScrollOnPrepend 同步给引擎（默认 true）", () => {
    const setPreserveScrollOnPrepend = vi.fn();

    renderViewport({}, { setPreserveScrollOnPrepend });

    expect(setPreserveScrollOnPrepend).toHaveBeenCalledWith(true);
  });

  it("显示传入 preserveScrollOnPrepend=false 时同步 false", () => {
    const setPreserveScrollOnPrepend = vi.fn();

    renderViewport(
      { preserveScrollOnPrepend: false },
      {
        setPreserveScrollOnPrepend,
      },
    );

    expect(setPreserveScrollOnPrepend).toHaveBeenCalledWith(false);
  });

  it("该 prop 变化时会重新同步", () => {
    const setPreserveScrollOnPrepend = vi.fn();
    const [preserve, setPreserve] = createSignal(true);

    render(
      () => <MessageScrollerViewport preserveScrollOnPrepend={preserve()} />,
      { wrapper: contextWrapper(fakeContext({ setPreserveScrollOnPrepend })) },
    );
    expect(setPreserveScrollOnPrepend).toHaveBeenLastCalledWith(true);

    setPreserve(false);
    expect(setPreserveScrollOnPrepend).toHaveBeenLastCalledWith(false);
  });

  it("外部 ref 与内部注册同时生效", () => {
    const setViewport = vi.fn();
    const external = vi.fn();

    const { container } = renderViewport({ ref: external }, { setViewport });

    expect(external).toHaveBeenCalledWith(viewportOf(container));
    expect(setViewport).toHaveBeenCalledWith(viewportOf(container));
  });
});

describe("MessageScrollerViewport - 脱离 Provider", () => {
  it("抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <MessageScrollerViewport />)).toThrow(
      /<MessageScrollerViewport> 必须渲染在 <MessageScrollerProvider> 内部/,
    );

    error.mockRestore();
  });
});
