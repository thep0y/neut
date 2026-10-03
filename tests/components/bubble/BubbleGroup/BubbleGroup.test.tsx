import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { BubbleGroup } from "~/components/bubble/BubbleGroup/BubbleGroup";

function groupOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="bubble-group"]') as HTMLElement;
}

/** BubbleGroup：把同一发送者的连续气泡分组。 */
describe("BubbleGroup", () => {
  it("渲染 div，带 data-slot 与纵向排布类名", () => {
    const { container } = render(() => <BubbleGroup />);
    const element = groupOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("bubble-group");
    expect(element.classList.contains("flex")).toBe(true);
    expect(element.classList.contains("flex-col")).toBe(true);
    expect(element.classList.contains("gap-2")).toBe(true);
  });

  it("合并 class 与 classList，且内置类名不被顶掉", () => {
    const { container } = render(() => (
      <BubbleGroup class="my-thread" classList={{ "is-tight": true }} />
    ));
    const element = groupOf(container);

    expect(element.classList.contains("my-thread")).toBe(true);
    expect(element.classList.contains("is-tight")).toBe(true);
    expect(element.classList.contains("min-w-0")).toBe(true);
  });

  it("透传其余属性、角色与 children", () => {
    const { container, getAllByTestId } = render(() => (
      <BubbleGroup role="log" aria-label="对话" data-thread-id="t-1">
        <span data-testid="bubble" />
        <span data-testid="bubble" />
      </BubbleGroup>
    ));
    const element = groupOf(container);

    expect(element.getAttribute("role")).toBe("log");
    expect(element.getAttribute("aria-label")).toBe("对话");
    expect(element.getAttribute("data-thread-id")).toBe("t-1");
    expect(getAllByTestId("bubble")).toHaveLength(2);
  });
});
