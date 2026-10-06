import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Spinner } from "~/components/spinner/Spinner";

/** Spinner：加载指示器，带 role=status 与可访问名。 */
function spinnerOf(container: HTMLElement): SVGElement {
  return container.querySelector("svg") as SVGElement;
}

describe("Spinner", () => {
  it("带 role=status 与 aria-label", () => {
    const { container } = render(() => <Spinner />);
    const spinner = spinnerOf(container);

    expect(spinner.getAttribute("role")).toBe("status");
    expect(spinner.getAttribute("aria-label")).toBe("Loading");
  });

  it("允许用 aria-label 覆盖默认文案", () => {
    const { container } = render(() => <Spinner aria-label="加载中" />);

    expect(spinnerOf(container).getAttribute("aria-label")).toBe("加载中");
  });

  it("合并 class 与 classList 并透传其余属性", () => {
    const { container } = render(() => (
      <Spinner class="my-spinner" classList={{ "is-spinning": true }} id="s" />
    ));
    const spinner = spinnerOf(container);

    expect(spinner.getAttribute("class")).toContain("my-spinner");
    expect(spinner.getAttribute("class")).toContain("is-spinning");
    expect(spinner.id).toBe("s");
  });
});
