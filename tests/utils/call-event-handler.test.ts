import { describe, expect, it, vi } from "vitest";
import { callEventHandler } from "~/utils/call-event-handler";

/**
 * `callEventHandler` 的契约来自 Solid 的 `EventHandlerUnion`
 * （见 `node_modules/solid-js/types/jsx.d.ts`）：
 * - 普通函数：`handler(event)`
 * - bound handler：`{ 0: (data, event) => void, 1: data }`，
 *   调用约定 `handler[0](handler[1], event)`（**data 在前、event 在后**）
 */
describe("callEventHandler - 普通函数", () => {
  it("传入事件对象", () => {
    const handler = vi.fn();
    const event = new MouseEvent("click");

    callEventHandler(handler, event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("透传同一个事件实例（KeyboardEvent）", () => {
    const handler = vi.fn();
    const event = new KeyboardEvent("keydown", { key: "Enter" });

    callEventHandler(handler, event);

    expect(handler.mock.calls[0][0]).toBe(event);
    expect(handler.mock.calls[0][0].key).toBe("Enter");
  });
});

describe("callEventHandler - bound handler", () => {
  it("数组形式 [handler, data]：data 在前、event 在后", () => {
    const handler = vi.fn();
    const event = new MouseEvent("click");

    callEventHandler([handler, { id: 7 }], event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ id: 7 }, event);
  });

  it("绑定对象形式 { 0, 1 }：同样 data 在前、event 在后", () => {
    // Solid 的 BoundEventHandler 是"带数字键的对象"，不是数组
    const handler = vi.fn();
    const event = new MouseEvent("click");
    const bound = { 0: handler, 1: "payload" };

    callEventHandler(bound, event);

    expect(handler).toHaveBeenCalledWith("payload", event);
  });

  it("bound 形式只调用一次（不会把 data 也当成处理器调用）", () => {
    const handler = vi.fn();
    const data = vi.fn();

    callEventHandler([handler, data], new Event("click"));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(data).not.toHaveBeenCalled();
  });

  it("bound 形式的第 0 项不是函数时静默跳过，不抛错", () => {
    expect(() =>
      callEventHandler([undefined, "data"], new Event("click")),
    ).not.toThrow();
  });
});

describe("callEventHandler - 边界输入", () => {
  it("undefined / null 不抛错", () => {
    expect(() => callEventHandler(undefined, new Event("click"))).not.toThrow();
    expect(() => callEventHandler(null, new Event("click"))).not.toThrow();
  });

  it("非函数且非绑定对象（如字符串）不抛错、不调用", () => {
    expect(() =>
      callEventHandler("not-a-function", new Event("click")),
    ).not.toThrow();
  });

  it("空数组不抛错", () => {
    expect(() => callEventHandler([], new Event("click"))).not.toThrow();
  });
});
