import { describe, expect, it } from "vitest";
import { createVirtualElement } from "~/lib/positioner/virtual-element";

describe("createVirtualElement", () => {
  it("rect 锚定到给定坐标，宽高为 0", () => {
    const el = createVirtualElement({ x: 120, y: 340 });

    expect(el.getBoundingClientRect()).toEqual({
      x: 120,
      y: 340,
      width: 0,
      height: 0,
    });
  });

  it("不传 contextElement 时为 undefined", () => {
    const el = createVirtualElement({ x: 0, y: 0 });

    expect(el.contextElement).toBeUndefined();
  });

  it("透传 contextElement 供 autoUpdate 查找滚动祖先", () => {
    const anchor = document.createElement("button");
    const el = createVirtualElement({ x: 5, y: 6, contextElement: anchor });

    expect(el.contextElement).toBe(anchor);
  });

  it("支持负坐标（视口左上角之外）", () => {
    const el = createVirtualElement({ x: -10, y: -20 });

    expect(el.getBoundingClientRect()).toEqual({
      x: -10,
      y: -20,
      width: 0,
      height: 0,
    });
  });

  it("rect 每次调用时读取，入参对象后续变更会反映出来", () => {
    // 实现是闭包引用 point 对象，getBoundingClientRect 里现读现用。
    // 调用方若需要"冻结"坐标，应传字面量或用 signal 包裹。
    const point = { x: 10, y: 20 };
    const el = createVirtualElement(point);

    expect(el.getBoundingClientRect().x).toBe(10);

    point.x = 999;

    expect(el.getBoundingClientRect().x).toBe(999);
  });

  it("宽高始终为 0（锚点是一个像素位置而非区域）", () => {
    const el = createVirtualElement({ x: 1, y: 2 });
    const r = el.getBoundingClientRect();

    expect(r.width).toBe(0);
    expect(r.height).toBe(0);
  });
});
