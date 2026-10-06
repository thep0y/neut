import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Progress } from "~/components/progress/Progress/Progress";
import { ProgressTrack } from "~/components/progress/ProgressTrack/ProgressTrack";

/** ProgressTrack：进度条的底槽，state 由 context 的 value 推出。 */
function trackOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="progress-track"]') as HTMLElement;
}

describe("ProgressTrack", () => {
  it("渲染底槽并带 data-progressing", () => {
    const { container } = render(() => (
      <Progress value={50}>
        <ProgressTrack data-testid="t" />
      </Progress>
    ));
    const track = trackOf(container);

    expect(track).not.toBeNull();
    expect(track.getAttribute("data-progressing")).toBe("true");
  });

  it("边界值下 data-progressing 为 false", () => {
    for (const value of [0, 100]) {
      const { container } = render(() => (
        <Progress value={value}>
          <ProgressTrack />
        </Progress>
      ));
      expect(
        trackOf(container).getAttribute("data-progressing"),
        String(value),
      ).toBe("false");
    }
  });

  it("合并类名与 classList 并透传其余属性", () => {
    const { container } = render(() => (
      <Progress value={10}>
        <ProgressTrack
          class="my-track"
          classList={{ "is-dashed": true }}
          id="t"
        />
      </Progress>
    ));
    const track = trackOf(container);

    expect(track.className).toContain("my-track");
    expect(track.className).toContain("is-dashed");
    expect(track.id).toBe("t");
  });
});
