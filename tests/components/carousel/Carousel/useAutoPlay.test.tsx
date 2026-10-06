import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { useAutoPlay } from "~/components/carousel/Carousel/useAutoPlay";

/**
 * `useAutoPlay` 的定时器编排。假定时器用于让 interval 确定性触发
 * （TESTING.md §5.6 / §4.5：时间属于系统边界）。
 */

function Host(props: {
  enabled: boolean;
  interval?: number;
  onNext: () => void;
}) {
  useAutoPlay(props.enabled, props.interval ?? 1000, props.onNext);
  return <div data-testid="autoplay-host" />;
}

describe("useAutoPlay", () => {
  it("enabled=false 时不启动定时器", () => {
    vi.useFakeTimers();
    const onNext = vi.fn();

    render(() => <Host enabled={false} onNext={onNext} />);
    vi.advanceTimersByTime(10_000);

    expect(onNext).not.toHaveBeenCalled();
  });

  it("enabled=true 时每个 interval 推进一次", () => {
    vi.useFakeTimers();
    const onNext = vi.fn();

    render(() => <Host enabled interval={1000} onNext={onNext} />);

    vi.advanceTimersByTime(999);
    expect(onNext).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onNext).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(onNext).toHaveBeenCalledTimes(2);
  });

  it("使用传入的自定义间隔", () => {
    vi.useFakeTimers();
    const onNext = vi.fn();

    render(() => <Host enabled interval={400} onNext={onNext} />);

    vi.advanceTimersByTime(399);
    expect(onNext).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("卸载后清理定时器，不再推进", () => {
    vi.useFakeTimers();
    const onNext = vi.fn();

    const { unmount } = render(() => (
      <Host enabled interval={1000} onNext={onNext} />
    ));
    vi.advanceTimersByTime(1000);
    expect(onNext).toHaveBeenCalledTimes(1);

    unmount();
    vi.advanceTimersByTime(5000);

    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
