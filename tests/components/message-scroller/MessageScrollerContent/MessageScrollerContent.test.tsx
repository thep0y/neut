import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { MessageScrollerContent } from "~/components/message-scroller/MessageScrollerContent/MessageScrollerContent";
import {
  contextWrapper,
  fakeContext,
} from "~tests/components/message-scroller/test-utils";

/**
 * 会话容器：`role="log"` 的 live region，并在末尾渲染由引擎控制高度的 spacer。
 */
function renderContent(
  props: Parameters<typeof MessageScrollerContent>[0] = {},
  overrides: Parameters<typeof fakeContext>[0] = {},
) {
  return render(() => <MessageScrollerContent {...props} />, {
    wrapper: contextWrapper(fakeContext(overrides)),
  });
}

function contentOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="message-scroller-content"]');
}

function spacerOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector("[data-message-scroller-spacer]");
}

describe("MessageScrollerContent - 结构", () => {
  it("渲染会话容器与内部 spacer", () => {
    const { container } = renderContent();

    expect(contentOf(container)?.tagName).toBe("DIV");
    expect(spacerOf(container)).not.toBeNull();
  });

  it("合并布局类名与外部 class，并应用 classList", () => {
    const { container } = renderContent({
      class: "my-content",
      classList: { "is-busy": true },
    });

    expect(contentOf(container)?.className).toContain("flex");
    expect(contentOf(container)?.className).toContain("my-content");
    expect(contentOf(container)?.className).toContain("is-busy");
  });

  it("渲染 children", () => {
    const { container } = renderContent({
      children: <p data-testid="row">hello</p>,
    });

    expect(container.querySelector('[data-testid="row"]')).not.toBeNull();
  });
});

describe("MessageScrollerContent - live region 语义", () => {
  it("默认 role=log、aria-relevant=additions，且不设置 aria-busy", () => {
    const { container } = renderContent();
    const element = contentOf(container);

    expect(element?.getAttribute("role")).toBe("log");
    expect(element?.getAttribute("aria-relevant")).toBe("additions");
    expect(element?.hasAttribute("aria-busy")).toBe(false);
  });

  it("aria-busy 为 true 时输出 aria-busy=true", () => {
    const { container } = renderContent({ "aria-busy": true });

    expect(contentOf(container)?.getAttribute("aria-busy")).toBe("true");
  });

  it("aria-busy 为 false 时也显式输出（区分「未知」与「已知不忙」）", () => {
    const { container } = renderContent({ "aria-busy": false });

    expect(contentOf(container)?.getAttribute("aria-busy")).toBe("false");
  });

  it("role 与 aria-relevant 可被覆盖", () => {
    const { container } = renderContent({
      role: "feed",
      "aria-relevant": "additions text",
    });
    const element = contentOf(container);

    expect(element?.getAttribute("role")).toBe("feed");
    expect(element?.getAttribute("aria-relevant")).toBe("additions text");
  });
});

describe("MessageScrollerContent - spacer", () => {
  it("spacer 默认 hidden、aria-hidden 且带占位 data 属性", () => {
    const { container } = renderContent();
    const spacer = spacerOf(container);

    expect(spacer?.hasAttribute("hidden")).toBe(true);
    expect(spacer?.getAttribute("aria-hidden")).toBe("true");
    expect(spacer?.hasAttribute("data-message-scroller-spacer")).toBe(true);
  });

  it("spacerClassName 会应用到 spacer 上", () => {
    const { container } = renderContent({ spacerClassName: "shrink-0" });

    expect(spacerOf(container)?.className).toBe("shrink-0");
  });

  it("挂载时把容器与 spacer 注册给引擎，卸载时清空", () => {
    const setContent = vi.fn();
    const setSpacer = vi.fn();
    const { container, unmount } = renderContent({}, { setContent, setSpacer });

    expect(setContent).toHaveBeenCalledWith(contentOf(container));
    expect(setSpacer).toHaveBeenCalledWith(spacerOf(container));

    unmount();
    expect(setContent).toHaveBeenLastCalledWith(undefined);
    expect(setSpacer).toHaveBeenLastCalledWith(undefined);
  });
});

describe("MessageScrollerContent - 脱离 Provider", () => {
  it("抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <MessageScrollerContent />)).toThrow(
      /<MessageScrollerContent> 必须渲染在 <MessageScrollerProvider> 内部/,
    );

    error.mockRestore();
  });
});
