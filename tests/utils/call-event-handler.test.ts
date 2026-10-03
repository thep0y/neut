import { describe, expect, it, vi } from "vitest";
import { callEventHandler } from "~/utils/call-event-handler";

describe("callEventHandler", () => {
  it("调用单个函数处理器并传入事件对象", () => {
    const handler = vi.fn();
    const event = new MouseEvent("click");

    callEventHandler(handler, event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("逐个调用处理器数组里的每一个函数", () => {
    const first = vi.fn();
    const second = vi.fn();
    const event = new MouseEvent("click");

    callEventHandler([first, second], event);

    expect(first).toHaveBeenCalledWith(event);
    expect(second).toHaveBeenCalledWith(event);
  });

  it("调用顺序与数组顺序一致", () => {
    const calls: string[] = [];
    callEventHandler(
      [() => calls.push("first"), () => calls.push("second")],
      new Event("click"),
    );

    expect(calls).toEqual(["first", "second"]);
  });

  it("跳过非函数项(Solid 的 restKeys 可能是 undefined 或绑定对象)", () => {
    // 这是 splitProps 的常见产物：没有传处理器时拿到 undefined
    expect(() => callEventHandler(undefined, new Event("click"))).not.toThrow();
  });

  it("数组里混入非函数项时只调用函数项", () => {
    const handler = vi.fn();

    callEventHandler(
      [undefined, handler, null, "not-a-function"],
      new Event("click"),
    );

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("空数组不调用任何处理器", () => {
    const event = new Event("click");
    expect(() => callEventHandler([], event)).not.toThrow();
  });

  it("传入 KeyboardEvent 时把同一个事件实例透传给处理器", () => {
    const handler = vi.fn();
    const event = new KeyboardEvent("keydown", { key: "Enter" });

    callEventHandler(handler, event);

    expect(handler.mock.calls[0][0]).toBe(event);
    expect(handler.mock.calls[0][0].key).toBe("Enter");
  });
});
