import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BubbleContent } from "~/components/bubble/BubbleContent/BubbleContent";

function contentOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="bubble-content"]') as HTMLElement;
}

/** BubbleContent：气泡内容槽，默认 div，可多态换成 button / a。 */
describe("BubbleContent - 默认渲染", () => {
  it("默认渲染 div，带 data-slot 与内容类名", () => {
    const { container } = render(() => <BubbleContent>你好</BubbleContent>);
    const element = contentOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("bubble-content");
    expect(element.classList.contains("rounded-xl")).toBe(true);
    expect(element.classList.contains("break-words")).toBe(true);
    expect(element.textContent).toBe("你好");
  });

  it("合并 class 与 classList，且内置类名不被覆盖（回归：classList 曾被 spread 顶掉）", () => {
    const { container } = render(() => (
      <BubbleContent class="my-content" classList={{ "is-on": true }} />
    ));
    const element = contentOf(container);

    expect(element.classList.contains("my-content")).toBe(true);
    expect(element.classList.contains("is-on")).toBe(true);
    expect(element.classList.contains("px-3")).toBe(true);
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <BubbleContent id="c1" data-message-id="m-1">
        <span data-testid="child">正文</span>
      </BubbleContent>
    ));
    const element = contentOf(container);

    expect(element.id).toBe("c1");
    expect(element.getAttribute("data-message-id")).toBe("m-1");
    expect(container.querySelector('[data-testid="child"]')?.textContent).toBe(
      "正文",
    );
  });
});

describe("BubbleContent - 多态", () => {
  it("component=button 渲染真正的按钮，点击回调可触发", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container, getByRole } = render(() => (
      <BubbleContent
        component="button"
        type="button"
        aria-label="查看详情"
        onClick={onClick}
      >
        查看详情
      </BubbleContent>
    ));
    const button = getByRole("button", { name: "查看详情" });

    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("data-slot")).toBe("bubble-content");
    expect(button.getAttribute("type")).toBe("button");
    expect(contentOf(container)).toBe(button);

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("component=a 渲染链接并透传 href/target/rel", () => {
    const { getByRole } = render(() => (
      <BubbleContent
        component="a"
        href="/docs/1"
        target="_blank"
        rel="noreferrer"
      >
        打开文档
      </BubbleContent>
    ));
    const link = getByRole("link", { name: "打开文档" });

    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/docs/1");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
  });

  it("多态路径同样合并 class 与 classList，内置类名保留", () => {
    const { container } = render(() => (
      <BubbleContent
        component="button"
        type="button"
        class="my-cta"
        classList={{ "is-cta": true }}
      />
    ));
    const element = contentOf(container);

    expect(element.tagName).toBe("BUTTON");
    expect(element.classList.contains("my-cta")).toBe(true);
    expect(element.classList.contains("is-cta")).toBe(true);
    expect(element.classList.contains("[button,a]:transition-colors")).toBe(
      true,
    );
  });

  it("ref 指向真实渲染的元素", () => {
    let element: HTMLElement | undefined;
    render(() => (
      <BubbleContent
        component="button"
        ref={(node: HTMLElement) => {
          element = node;
        }}
      />
    ));

    expect(element?.tagName).toBe("BUTTON");
    expect(element?.getAttribute("data-slot")).toBe("bubble-content");
  });
});
