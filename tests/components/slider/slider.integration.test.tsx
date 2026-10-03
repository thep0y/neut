import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "~/components/slider/Slider";
import {
  stubPointerCapture,
  stubRect,
} from "~tests/components/slider/test-utils";

/** 渲染 Slider 并暴露常用查询 */
function setup(props: Parameters<typeof Slider>[0] = {}) {
  const result = render(() => <Slider {...props} />);
  const track = () =>
    result.container.querySelector('[data-slot="slider-track"]') as HTMLElement;
  const control = () => track().parentElement as HTMLElement;
  const thumbs = () =>
    Array.from(
      result.container.querySelectorAll('[data-slot="slider-thumb"]'),
    ) as HTMLElement[];
  const indicator = () =>
    result.container.querySelector('[data-slot="slider-range"]') as HTMLElement;

  /** 给 track 一个横向矩形，并给 control 补 pointer capture */
  const layout = (box = { left: 0, top: 0, width: 200, height: 10 }) => {
    stubRect(track(), box);
    const captured = stubPointerCapture(control());
    return captured;
  };

  return { ...result, track, control, thumbs, indicator, layout };
}

const positionOf = (el: HTMLElement) => el.style.getPropertyValue("--position");

describe("Slider 组合行为", () => {
  it("非受控：pointerdown 按坐标换算并更新单 thumb，onValueChange 收到数字", () => {
    const onValueChange = vi.fn();
    const slider = setup({ defaultValue: 0, onValueChange });
    slider.layout();

    fireEvent.pointerDown(slider.control(), {
      button: 0,
      pointerId: 1,
      clientX: 50,
    });

    expect(positionOf(slider.thumbs()[0])).toBe("25%");
    expect(onValueChange).toHaveBeenCalledWith(25);
  });

  it("拖拽：pointerdown 后 pointermove 持续跟随坐标", () => {
    const onValueChange = vi.fn();
    const slider = setup({ defaultValue: 0, onValueChange });
    slider.layout();

    fireEvent.pointerDown(slider.control(), {
      button: 0,
      pointerId: 1,
      clientX: 50,
    });
    fireEvent.pointerMove(slider.control(), { pointerId: 1, clientX: 150 });

    expect(positionOf(slider.thumbs()[0])).toBe("75%");
    expect(onValueChange).toHaveBeenLastCalledWith(75);
  });

  it("没有先 pointerdown（未捕获）时 pointermove 不改变值", () => {
    const onValueChange = vi.fn();
    const slider = setup({ defaultValue: 0, onValueChange });
    slider.layout();

    fireEvent.pointerMove(slider.control(), { pointerId: 1, clientX: 150 });

    expect(positionOf(slider.thumbs()[0])).toBe("0%");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("pointerup 释放捕获后，后续 pointermove 不再更新", () => {
    const slider = setup({ defaultValue: 0 });
    slider.layout();

    fireEvent.pointerDown(slider.control(), {
      button: 0,
      pointerId: 1,
      clientX: 50,
    });
    fireEvent.pointerUp(slider.control(), { pointerId: 1 });
    fireEvent.pointerMove(slider.control(), { pointerId: 1, clientX: 150 });

    expect(positionOf(slider.thumbs()[0])).toBe("25%");
  });

  it("拖拽时按坐标吸附到 step，并夹取到 min/max 之间", () => {
    const slider = setup({ defaultValue: 0, step: 10, max: 100 });
    slider.layout();
    const control = slider.control();

    fireEvent.pointerDown(control, { button: 0, pointerId: 1, clientX: 30 });
    expect(positionOf(slider.thumbs()[0])).toBe("20%");

    fireEvent.pointerMove(control, { pointerId: 1, clientX: 999 });
    expect(positionOf(slider.thumbs()[0])).toBe("100%");
  });

  it("多 thumb：点击离哪个 thumb 近就拖哪一个，另一个保持不变", () => {
    const onValueChange = vi.fn();
    const slider = setup({ defaultValue: [20, 60], onValueChange });
    slider.layout();

    // clientX=170 → 值 85，离 60（差 25）比 20（差 65）近
    fireEvent.pointerDown(slider.control(), {
      button: 0,
      pointerId: 1,
      clientX: 170,
    });

    expect(positionOf(slider.thumbs()[0])).toBe("20%");
    expect(positionOf(slider.thumbs()[1])).toBe("85%");
    expect(onValueChange).toHaveBeenCalledWith([20, 85]);
  });

  it("多 thumb：两个 thumb 不允许交叉，被夹在相邻 thumb 旁边一步", () => {
    const slider = setup({ defaultValue: [20, 60] });
    slider.layout();

    // 先选右 thumb（值 85 离 60 更近），再向左拖到越过左 thumb
    fireEvent.pointerDown(slider.control(), {
      button: 0,
      pointerId: 1,
      clientX: 170,
    });
    fireEvent.pointerMove(slider.control(), { pointerId: 1, clientX: 2 });

    expect(positionOf(slider.thumbs()[0])).toBe("20%");
    expect(positionOf(slider.thumbs()[1])).toBe("21%");
  });

  it("多 thumb：onValueChange 收到数组形式的完整值", () => {
    const onValueChange = vi.fn();
    const slider = setup({ defaultValue: [10, 60], onValueChange });
    slider.layout();

    // 选左 thumb（值 25 离 10 更近），拖到 25
    fireEvent.pointerDown(slider.control(), {
      button: 0,
      pointerId: 1,
      clientX: 50,
    });

    expect(onValueChange).toHaveBeenCalledWith([25, 60]);
    expect(positionOf(slider.thumbs()[0])).toBe("25%");
    expect(positionOf(slider.thumbs()[1])).toBe("60%");
  });

  it("纵向：clientY 决定值，底部为 min、顶部为 max", () => {
    const onValueChange = vi.fn();
    const slider = setup({
      defaultValue: 0,
      orientation: "vertical",
      onValueChange,
    });
    slider.layout({ left: 0, top: 0, width: 10, height: 200 });

    fireEvent.pointerDown(slider.control(), {
      button: 0,
      pointerId: 1,
      clientY: 50,
    });

    expect(positionOf(slider.thumbs()[0])).toBe("75%");
    expect(onValueChange).toHaveBeenCalledWith(75);
    expect(slider.thumbs()[0]).toHaveAttribute("data-orientation", "vertical");
  });

  it("键盘：方向键 / Home / End 更新值并回调，且阻止默认行为", () => {
    const onValueChange = vi.fn();
    const slider = setup({ defaultValue: 40, onValueChange });
    const thumb = slider.thumbs()[0];

    const right = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    fireEvent(thumb, right);
    expect(right.defaultPrevented).toBe(true);
    expect(positionOf(thumb)).toBe("41%");

    fireEvent.keyDown(thumb, { key: "ArrowUp" });
    expect(positionOf(thumb)).toBe("42%");

    fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    expect(positionOf(thumb)).toBe("41%");

    fireEvent.keyDown(thumb, { key: "ArrowDown" });
    expect(positionOf(thumb)).toBe("40%");

    fireEvent.keyDown(thumb, { key: "Home" });
    expect(positionOf(thumb)).toBe("0%");

    fireEvent.keyDown(thumb, { key: "End" });
    expect(positionOf(thumb)).toBe("100%");

    expect(onValueChange).toHaveBeenNthCalledWith(1, 41);
    expect(onValueChange).toHaveBeenLastCalledWith(100);
  });

  it("键盘：Shift + 方向键走 10 倍步长", () => {
    const slider = setup({ defaultValue: 40, step: 2 });
    const thumb = slider.thumbs()[0];

    fireEvent.keyDown(thumb, { key: "ArrowRight", shiftKey: true });

    expect(positionOf(thumb)).toBe("60%");
  });

  it("纵向键盘：ArrowUp 增大、ArrowDown 减小，左右键不响应", () => {
    const onValueChange = vi.fn();
    const slider = setup({
      defaultValue: 40,
      orientation: "vertical",
      onValueChange,
    });
    const thumb = slider.thumbs()[0];

    fireEvent.keyDown(thumb, { key: "ArrowUp" });
    expect(positionOf(thumb)).toBe("41%");

    fireEvent.keyDown(thumb, { key: "ArrowDown" });
    expect(positionOf(thumb)).toBe("40%");

    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    expect(positionOf(thumb)).toBe("40%");
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it("disabled：pointerdown 与键盘都不改值，且写出可观察的禁用状态", () => {
    const onValueChange = vi.fn();
    const slider = setup({ defaultValue: 40, disabled: true, onValueChange });
    slider.layout();
    const thumb = slider.thumbs()[0];

    expect(slider.control()).toHaveAttribute("data-disabled", "true");
    expect(thumb).toHaveAttribute("data-disabled", "true");
    expect(thumb).toHaveAttribute("aria-disabled", "true");
    expect(thumb).toHaveAttribute("tabindex", "-1");

    fireEvent.pointerDown(slider.control(), {
      button: 0,
      pointerId: 1,
      clientX: 80,
    });
    fireEvent.keyDown(thumb, { key: "ArrowRight" });

    expect(positionOf(thumb)).toBe("40%");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("受控：拖动只触发 onValueChange，UI 保持外部传入的值", () => {
    const onValueChange = vi.fn();
    const slider = setup({ value: 20, onValueChange });
    slider.layout();

    fireEvent.pointerDown(slider.control(), {
      button: 0,
      pointerId: 1,
      clientX: 100,
    });

    expect(onValueChange).toHaveBeenCalledWith(50);
    expect(positionOf(slider.thumbs()[0])).toBe("20%");
  });

  it("受控：外部回写 value 后 UI 跟随", () => {
    const [value, setValue] = createSignal(20);
    const slider = setup({
      get value() {
        return value();
      },
    });
    slider.layout();

    expect(positionOf(slider.thumbs()[0])).toBe("20%");

    setValue(70);

    expect(positionOf(slider.thumbs()[0])).toBe("70%");
  });

  it("受控：拖动只回调，不改内部状态；外部回写后 UI 才更新", () => {
    const [value, setValue] = createSignal(30);
    const calls: number[] = [];
    const slider = setup({
      get value() {
        return value();
      },
      onValueChange: (v) => {
        calls.push(v as number);
        setValue((v as number) + 10);
      },
    });
    slider.layout();

    fireEvent.pointerDown(slider.control(), {
      button: 0,
      pointerId: 1,
      clientX: 40,
    });

    // 拖动坐标 40/200 → 值 20；控件没有把 20 写进内部状态，而是由外部回调回写为 30
    expect(calls).toEqual([20]);
    expect(positionOf(slider.thumbs()[0])).toBe("30%");

    setValue(20);

    expect(positionOf(slider.thumbs()[0])).toBe("20%");
  });

  it("indicator 跟随：单 thumb 从 0 拉到当前值", () => {
    const slider = setup({ defaultValue: 30 });

    expect(slider.indicator().style.getPropertyValue("--start-position")).toBe(
      "0%",
    );
    expect(slider.indicator().style.getPropertyValue("--relative-size")).toBe(
      "30%",
    );

    fireEvent.keyDown(slider.thumbs()[0], { key: "End" });

    expect(slider.indicator().style.getPropertyValue("--relative-size")).toBe(
      "100%",
    );
  });

  it("indicator 跟随：双 thumb 覆盖首尾之间的区间", () => {
    const slider = setup({ defaultValue: [20, 60] });

    expect(slider.indicator().style.getPropertyValue("--start-position")).toBe(
      "20%",
    );
    expect(slider.indicator().style.getPropertyValue("--relative-size")).toBe(
      "40%",
    );

    fireEvent.keyDown(slider.thumbs()[1], { key: "ArrowRight" });

    expect(slider.indicator().style.getPropertyValue("--relative-size")).toBe(
      "41%",
    );
  });
});
