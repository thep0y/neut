import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Progress } from "~/components/progress/Progress/Progress";
import { ProgressIndicator } from "~/components/progress/ProgressIndicator/ProgressIndicator";

/** ProgressIndicator：真正被拉伸的那条，宽度按百分比写死。 */
function indicatorOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="progress-indicator"]',
  ) as HTMLElement;
}

describe("ProgressIndicator", () => {
  it("宽度按 value 百分比设置，并带 data-progressing", () => {
    const { container } = render(() => (
      <Progress value={25}>
        <ProgressIndicator />
      </Progress>
    ));
    const indicator = indicatorOf(container);

    expect(indicator.style.width).toBe("25%");
    expect(indicator.getAttribute("data-progressing")).toBe("true");
  });

  it("边界值下宽度为 0% / 100%，data-progressing 为 false", () => {
    const zero = render(() => <Progress value={0} />);
    expect(indicatorOf(zero.container).style.width).toBe("0%");
    expect(indicatorOf(zero.container).getAttribute("data-progressing")).toBe(
      "false",
    );

    const full = render(() => <Progress value={100} />);
    expect(indicatorOf(full.container).style.width).toBe("100%");
    expect(indicatorOf(full.container).getAttribute("data-progressing")).toBe(
      "false",
    );
  });

  it("合并类名与 classList 并透传其余属性", () => {
    const { container } = render(() => (
      <Progress value={25}>
        <ProgressIndicator
          class="my-indicator"
          classList={{ "is-striped": true }}
          id="i"
        />
      </Progress>
    ));
    const indicator = indicatorOf(container);

    expect(indicator.className).toContain("my-indicator");
    expect(indicator.className).toContain("is-striped");
    expect(indicator.id).toBe("i");
  });
});
