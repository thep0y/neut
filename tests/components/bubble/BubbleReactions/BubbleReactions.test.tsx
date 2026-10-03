import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { BubbleReactions } from "~/components/bubble/BubbleReactions/BubbleReactions";

function reactionsOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="bubble-reactions"]',
  ) as HTMLElement;
}

/** BubbleReactions：贴在气泡边缘的回复/反应行，side + align 由 data-* 驱动。 */
describe("BubbleReactions - 默认值与定位", () => {
  it("渲染 div，默认贴底部右侧（side=bottom、align=end）", () => {
    const { container } = render(() => <BubbleReactions />);
    const element = reactionsOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("bubble-reactions");
    expect(element.getAttribute("data-side")).toBe("bottom");
    expect(element.getAttribute("data-align")).toBe("end");
  });

  it("side=top / align=start 时 data-* 与类名一起切换（双向）", () => {
    const bottom = reactionsOf(render(() => <BubbleReactions />).container);
    const top = reactionsOf(
      render(() => <BubbleReactions side="top" align="start" />).container,
    );

    expect(top.getAttribute("data-side")).toBe("top");
    expect(top.getAttribute("data-align")).toBe("start");
    expect(top.classList.contains("top-0")).toBe(true);
    expect(top.classList.contains("left-3")).toBe(true);
    expect(bottom.classList.contains("bottom-0")).toBe(true);
    expect(bottom.classList.contains("right-3")).toBe(true);
    expect(top.classList.contains("bottom-0")).toBe(false);
    expect(bottom.classList.contains("top-0")).toBe(false);
  });
});

describe("BubbleReactions - 透传", () => {
  it("合并 class 与 classList，且内置类名不被顶掉", () => {
    const { container } = render(() => (
      <BubbleReactions class="my-reactions" classList={{ "is-open": true }} />
    ));
    const element = reactionsOf(container);

    expect(element.classList.contains("my-reactions")).toBe(true);
    expect(element.classList.contains("is-open")).toBe(true);
    expect(element.classList.contains("absolute")).toBe(true);
    expect(element.classList.contains("rounded-full")).toBe(true);
  });

  it("透传 role / aria-label 与 children（展示型整行只播报一次）", () => {
    const { container, getByRole } = render(() => (
      <BubbleReactions role="img" aria-label="2 个回应：👍 和 ❤️">
        <span aria-hidden="true">👍</span>
        <span aria-hidden="true">❤️</span>
      </BubbleReactions>
    ));
    const element = getByRole("img", { name: "2 个回应：👍 和 ❤️" });

    expect(element).toBe(reactionsOf(container));
    expect(element.children).toHaveLength(2);
  });
});
