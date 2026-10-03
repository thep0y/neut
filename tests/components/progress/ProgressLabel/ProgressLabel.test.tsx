import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Progress } from "~/components/progress/Progress/Progress";
import { ProgressLabel } from "~/components/progress/ProgressLabel/ProgressLabel";

/** ProgressLabel：进度条旁边的说明文字。 */
describe("ProgressLabel", () => {
  it("渲染 span 并带 data-slot=progress-label", () => {
    const { container } = render(() => (
      <Progress value={10}>
        <ProgressLabel>上传中</ProgressLabel>
      </Progress>
    ));
    const label = container.querySelector("[data-slot='progress-label']");

    expect(label?.tagName).toBe("SPAN");
    expect(label?.textContent).toBe("上传中");
  });

  it("合并类名与 classList 并透传其余属性", () => {
    const { container } = render(() => (
      <Progress value={10}>
        <ProgressLabel class="my-label" classList={{ muted: true }} id="l" />
      </Progress>
    ));
    const label = container.querySelector("[data-slot='progress-label']")!;

    expect(label.className).toContain("my-label");
    expect(label.className).toContain("muted");
    expect(label.id).toBe("l");
  });
});
