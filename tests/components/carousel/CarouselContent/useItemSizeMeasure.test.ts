import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import type { Orientation } from "~/components/carousel/Carousel/Carousel.types";
import { useItemSizeMeasure } from "~/components/carousel/CarouselContent/useItemSizeMeasure";
import {
  stubOffsetBox,
  stubResizeObserver,
} from "~tests/components/carousel/test-utils";

/**
 * `useItemSizeMeasure` 的测量契约：从 track 的第一个 item 与 viewport 上读尺寸，
 * 并把这些尺寸写回 context。jsdom 无布局，尺寸由 stub 提供（TESTING.md §4.5）。
 */

function createElements() {
  const viewport = document.createElement("div");
  const track = document.createElement("div");
  const firstItem = document.createElement("fieldset");
  const secondItem = document.createElement("fieldset");
  track.append(firstItem, secondItem);
  viewport.appendChild(track);
  return { viewport, track, firstItem, secondItem };
}

function renderMeasure(options: {
  viewport?: HTMLElement;
  track?: HTMLElement;
  orientation?: Orientation;
  setItemSize: (size: number) => void;
  setViewportSize: (size: number) => void;
}) {
  return renderHook(() =>
    useItemSizeMeasure(
      () => options.viewport,
      () => options.track,
      () => options.orientation ?? "horizontal",
      options.setItemSize,
      options.setViewportSize,
    ),
  );
}

describe("useItemSizeMeasure - 挂载即测量", () => {
  it("水平方向取首个子项的 offsetWidth 与 viewport 的 offsetWidth", () => {
    const { viewport, track, firstItem } = createElements();
    stubOffsetBox(viewport, { width: 800, height: 300 });
    stubOffsetBox(firstItem, { width: 200, height: 120 });
    stubOffsetBox(track, { width: 600, height: 120 });
    const setItemSize = vi.fn();
    const setViewportSize = vi.fn();

    renderMeasure({
      viewport,
      track,
      setItemSize,
      setViewportSize,
    });

    expect(setItemSize).toHaveBeenCalledWith(200);
    expect(setViewportSize).toHaveBeenCalledWith(800);
  });

  it("垂直方向取 offsetHeight", () => {
    const { viewport, track, firstItem } = createElements();
    stubOffsetBox(viewport, { width: 800, height: 300 });
    stubOffsetBox(firstItem, { width: 200, height: 150 });
    const setItemSize = vi.fn();
    const setViewportSize = vi.fn();

    renderMeasure({
      viewport,
      track,
      orientation: "vertical",
      setItemSize,
      setViewportSize,
    });

    expect(setItemSize).toHaveBeenCalledWith(150);
    expect(setViewportSize).toHaveBeenCalledWith(300);
  });

  it("track 没有子项时只写 viewport 尺寸", () => {
    const viewport = document.createElement("div");
    const track = document.createElement("div");
    viewport.appendChild(track);
    stubOffsetBox(viewport, { width: 640 });
    const setItemSize = vi.fn();
    const setViewportSize = vi.fn();

    renderMeasure({
      viewport,
      track,
      setItemSize,
      setViewportSize,
    });

    expect(setItemSize).not.toHaveBeenCalled();
    expect(setViewportSize).toHaveBeenCalledWith(640);
  });
});

describe("useItemSizeMeasure - 缺失元素", () => {
  it("viewport 缺失时直接返回，不测量也不观察", () => {
    const { track } = createElements();
    const resizeObserver = stubResizeObserver();
    const setItemSize = vi.fn();
    const setViewportSize = vi.fn();

    renderMeasure({ track, setItemSize, setViewportSize });

    expect(setItemSize).not.toHaveBeenCalled();
    expect(setViewportSize).not.toHaveBeenCalled();
    expect(resizeObserver.instances).toHaveLength(0);
  });

  it("track 缺失时直接返回，不测量也不观察", () => {
    const { viewport } = createElements();
    const resizeObserver = stubResizeObserver();
    const setItemSize = vi.fn();
    const setViewportSize = vi.fn();

    renderMeasure({ viewport, setItemSize, setViewportSize });

    expect(setItemSize).not.toHaveBeenCalled();
    expect(setViewportSize).not.toHaveBeenCalled();
    expect(resizeObserver.instances).toHaveLength(0);
  });
});

describe("useItemSizeMeasure - ResizeObserver", () => {
  it("同时观察 viewport 与 track，尺寸变化后重新测量", () => {
    const { viewport, track, firstItem } = createElements();
    stubOffsetBox(viewport, { width: 800 });
    stubOffsetBox(firstItem, { width: 200 });
    const resizeObserver = stubResizeObserver();
    const setItemSize = vi.fn();
    const setViewportSize = vi.fn();

    renderMeasure({
      viewport,
      track,
      setItemSize,
      setViewportSize,
    });

    const instance = resizeObserver.instances[0];
    expect(instance.observed).toEqual([viewport, track]);

    stubOffsetBox(firstItem, { width: 250 });
    stubOffsetBox(viewport, { width: 1000 });
    instance.trigger();

    expect(setItemSize).toHaveBeenLastCalledWith(250);
    expect(setViewportSize).toHaveBeenLastCalledWith(1000);
  });

  it("卸载时断开观察", () => {
    const { viewport, track, firstItem } = createElements();
    stubOffsetBox(viewport, { width: 800 });
    stubOffsetBox(firstItem, { width: 200 });
    const resizeObserver = stubResizeObserver();

    const hook = renderMeasure({
      viewport,
      track,
      setItemSize: vi.fn(),
      setViewportSize: vi.fn(),
    });

    expect(resizeObserver.instances[0].disconnectCalls).toBe(0);

    hook.cleanup();

    expect(resizeObserver.instances[0].disconnectCalls).toBe(1);
  });
});
