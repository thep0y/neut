import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Progress } from "~/components/progress/Progress/Progress";
import { ProgressValue } from "~/components/progress/ProgressValue/ProgressValue";

/** ProgressValue：把 context 的 value 渲染成 "N%"。 */
function progressValue(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="progress-value"]') as HTMLElement;
}

describe("ProgressValue", () => {
  it("渲染为百分比文本", () => {
    const { container } = render(() => (
      <Progress value={42}>
        <ProgressValue />
      </Progress>
    ));

    expect(progressValue(container).textContent).toBe("42%");
  });

  it("边界值渲染 0% / 100%", () => {
    expect(
      progressValue(
        render(() => (
          <Progress value={0}>
            <ProgressValue />
          </Progress>
        )).container,
      ).textContent,
    ).toBe("0%");
    expect(
      progressValue(
        render(() => (
          <Progress value={100}>
            <ProgressValue />
          </Progress>
        )).container,
      ).textContent,
    ).toBe("100%");
  });

  it("合并类名与 classList 并透传其余属性", () => {
    const { container } = render(() => (
      <Progress value={10}>
        <ProgressValue class="my-value" classList={{ bold: true }} id="v" />
      </Progress>
    ));
    const element = progressValue(container);

    expect(element.className).toContain("my-value");
    expect(element.className).toContain("bold");
    expect(element.id).toBe("v");
  });
});
