import { describe, expect, it } from "vitest";
import { createChangeEventDetails } from "~/utils/create-change-event-details";

describe("createChangeEventDetails", () => {
  it("带上 reason / event / trigger", () => {
    const event = new MouseEvent("click");
    const trigger = document.createElement("button");

    const details = createChangeEventDetails("trigger-press", event, trigger);

    expect(details.reason).toBe("trigger-press");
    expect(details.event).toBe(event);
    expect(details.trigger).toBe(trigger);
  });

  it("event / trigger 缺省时为 undefined", () => {
    const details = createChangeEventDetails("none");

    expect(details.event).toBeUndefined();
    expect(details.trigger).toBeUndefined();
  });

  it("初始状态既未取消也未允许传播", () => {
    const details = createChangeEventDetails("none");

    expect(details.isCanceled).toBe(false);
    expect(details.isPropagationAllowed).toBe(false);
  });

  it("cancel() 之后 isCanceled 变为 true", () => {
    const details = createChangeEventDetails("none");

    details.cancel();

    expect(details.isCanceled).toBe(true);
  });

  it("allowPropagation() 之后 isPropagationAllowed 变为 true", () => {
    const details = createChangeEventDetails("none");

    details.allowPropagation();

    expect(details.isPropagationAllowed).toBe(true);
  });

  it("isCanceled / isPropagationAllowed 是 getter：回调内即时读到最新值", () => {
    // 这是共用的关键语义：如果实现把它们写成创建时的快照，
    // 回调里 cancel() 之后再读就永远是 false，组件就无法据此取消行为。
    const details = createChangeEventDetails("none");
    const observed: boolean[] = [];

    observed.push(details.isCanceled);
    details.cancel();
    observed.push(details.isCanceled);

    expect(observed).toEqual([false, true]);
  });

  it("cancel 与 allowPropagation 互不影响", () => {
    const details = createChangeEventDetails("none");

    details.cancel();

    expect(details.isPropagationAllowed).toBe(false);
  });

  it("重复调用 cancel() 保持 true", () => {
    const details = createChangeEventDetails("none");

    details.cancel();
    details.cancel();

    expect(details.isCanceled).toBe(true);
  });

  it("保留传入的 reason 字面量类型（不同组件各自的 reason 联合类型）", () => {
    expect(createChangeEventDetails("escape-key").reason).toBe("escape-key");
    expect(createChangeEventDetails("outside-press").reason).toBe(
      "outside-press",
    );
  });

  it("每次调用返回独立实例，cancel 状态不互相污染", () => {
    const first = createChangeEventDetails("none");
    const second = createChangeEventDetails("none");

    first.cancel();

    expect(first.isCanceled).toBe(true);
    expect(second.isCanceled).toBe(false);
  });
});
