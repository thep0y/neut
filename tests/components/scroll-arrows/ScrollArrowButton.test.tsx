import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ScrollArrowButton } from "~/components/scroll-arrows/ScrollArrowButton";

/**
 * 箭头是纯装饰层：只关心"该方向还有内容时渲染、否则不渲染"，
 * 以及**不参与指针命中**（这是它不抢点击、不与悬停滚动互相触发的前提）。
 * 悬停滚动由 `ScrollArrows` 在容器上驱动，因此箭头不需要 target。
 */
function renderArrow(
  props: Partial<Parameters<typeof ScrollArrowButton>[0]> = {},
) {
  return render(() => (
    <ScrollArrowButton
      direction={props.direction ?? "down"}
      visible={props.visible ?? true}
      class={props.class}
    />
  ));
}

function arrowOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector("[data-slot='scroll-arrow']");
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ScrollArrowButton - 显隐", () => {
  it("visible 为 true 时渲染箭头", () => {
    const { container } = renderArrow({ visible: true });

    expect(arrowOf(container)).not.toBeNull();
  });

  it("visible 为 false 时不渲染（Show 卸载）", () => {
    const { container } = renderArrow({ visible: false });

    expect(arrowOf(container)).toBeNull();
  });

  it("visible 变化时跟随渲染/卸载", () => {
    const [visible, setVisible] = createSignal(false);
    const { container } = render(() => (
      <ScrollArrowButton direction="down" visible={visible()} />
    ));

    expect(arrowOf(container)).toBeNull();
    setVisible(true);
    expect(arrowOf(container)).not.toBeNull();
    setVisible(false);
    expect(arrowOf(container)).toBeNull();
  });
});

describe("ScrollArrowButton - 装饰性（不参与指针命中）", () => {
  it("始终带 pointer-events-none：不抢边缘列表项的点击", () => {
    const { container } = renderArrow();

    expect(arrowOf(container)?.className).toContain("pointer-events-none");
  });

  it("带 aria-hidden，且不可聚焦、无交互语义", () => {
    const { container } = renderArrow();
    const element = arrowOf(container);

    expect(element?.getAttribute("aria-hidden")).toBe("true");
    expect(element?.hasAttribute("tabindex")).toBe(false);
    expect(element?.getAttribute("role")).toBeNull();
    expect(element?.hasAttribute("data-interactive")).toBe(false);
  });
});

describe("ScrollArrowButton - 方向与样式", () => {
  it("向下箭头贴底、向上箭头贴顶，并输出 data-direction", () => {
    const down = renderArrow({ direction: "down" });
    expect(arrowOf(down.container)?.className).toContain("bottom-0");
    expect(arrowOf(down.container)?.getAttribute("data-direction")).toBe(
      "down",
    );

    const up = renderArrow({ direction: "up" });
    expect(arrowOf(up.container)?.className).toContain("top-0");
    expect(arrowOf(up.container)?.getAttribute("data-direction")).toBe("up");
  });

  it("向下箭头用 ChevronDown、向上用 ChevronUp", () => {
    const down = renderArrow({ direction: "down" });
    expect(down.container.querySelectorAll("svg")).toHaveLength(1);
    // SVG 元素的 className 是 SVGAnimatedString，需读 class 属性
    const downIcon = down.container.querySelector("svg")?.getAttribute("class");
    const upIcon = renderArrow({ direction: "up" })
      .container.querySelector("svg")
      ?.getAttribute("class");
    expect(downIcon).toContain("lucide-chevron-down");
    expect(upIcon).toContain("lucide-chevron-up");
  });

  it("合并外部 class", () => {
    const { container } = renderArrow({ class: "rounded-b-lg" });

    expect(arrowOf(container)?.className).toContain("rounded-b-lg");
  });
});
