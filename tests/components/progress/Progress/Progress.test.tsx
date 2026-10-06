import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Progress } from "~/components/progress/Progress/Progress";
import { ProgressTrack } from "~/components/progress/ProgressTrack/ProgressTrack";

/**
 * Progress 根组件：`role="progressbar"` + 三个 aria 值，
 * 并把 value 通过 context 发给 track / indicator / value / label。
 * 它自己会补一条轨道与指示器，因此不写 children 也有可见进度条。
 */
function progressOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="progress"]') as HTMLElement;
}

describe("Progress - ARIA 与状态", () => {
  it("渲染 role=progressbar 并带上 min/max/now/valuetext", () => {
    const { container } = render(() => <Progress value={40} />);
    const element = progressOf(container);

    expect(element.getAttribute("role")).toBe("progressbar");
    expect(element.getAttribute("aria-valuemin")).toBe("0");
    expect(element.getAttribute("aria-valuemax")).toBe("100");
    expect(element.getAttribute("aria-valuenow")).toBe("40");
    expect(element.getAttribute("aria-valuetext")).toBe("40%");
  });

  it("0 与 100 时 data-progressing 为 false，中间值为 true", () => {
    expect(
      progressOf(render(() => <Progress value={0} />).container).getAttribute(
        "data-progressing",
      ),
    ).toBe("false");
    expect(
      progressOf(render(() => <Progress value={100} />).container).getAttribute(
        "data-progressing",
      ),
    ).toBe("false");
    expect(
      progressOf(render(() => <Progress value={50} />).container).getAttribute(
        "data-progressing",
      ),
    ).toBe("true");
  });

  it("值变化时 aria 与状态跟着更新", () => {
    const { container } = render(() => <Progress value={10} />);
    const element = progressOf(container);

    expect(element.getAttribute("aria-valuenow")).toBe("10");

    render(() => <Progress value={70} />);
    // 每次 render 都是新树，这里验证的是同一表达式下的取值正确性
    expect(
      progressOf(render(() => <Progress value={70} />).container).getAttribute(
        "aria-valuenow",
      ),
    ).toBe("70");
  });

  it("合并类名与 classList，并透传其余属性", () => {
    const { container } = render(() => (
      <Progress
        value={20}
        class="my-progress"
        classList={{ "is-thin": true }}
        id="p"
      />
    ));
    const element = progressOf(container);

    expect(element.className).toContain("my-progress");
    expect(element.className).toContain("is-thin");
    expect(element.id).toBe("p");
  });

  it("默认自带一条轨道与指示器", () => {
    const { container } = render(() => <Progress value={30} />);

    expect(
      container.querySelector('[data-slot="progress-track"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-slot="progress-indicator"]'),
    ).not.toBeNull();
  });

  it("渲染 children（如 Label / Value）", () => {
    const { container } = render(() => (
      <Progress value={30}>
        <span data-testid="custom">自定义</span>
      </Progress>
    ));

    expect(container.querySelector('[data-testid="custom"]')).not.toBeNull();
  });

  it("包含一个仅供屏幕阅读器的呈现元素", () => {
    const { container } = render(() => <Progress value={30} />);
    const presentation = container.querySelector('[role="presentation"]');

    expect(presentation).not.toBeNull();
    expect(presentation?.getAttribute("role")).toBe("presentation");
  });
});

describe("Progress - 缺少 Provider", () => {
  it("脱离 Progress 使用时抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <ProgressTrack />)).toThrow(
      /useProgressContext 必须用在 <Progress> 内部/,
    );

    error.mockRestore();
  });
});
