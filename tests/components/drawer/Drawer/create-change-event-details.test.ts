import { describe, expect, it } from "vitest";
import { createDrawerChangeEventDetails } from "~/components/drawer/Drawer/create-change-event-details";

describe("createDrawerChangeEventDetails", () => {
  it("透传 reason、事件与触发元素", () => {
    const event = new Event("click");
    const trigger = document.createElement("button");

    const details = createDrawerChangeEventDetails(
      "trigger-press",
      event,
      trigger,
    );

    expect(details.reason).toBe("trigger-press");
    expect(details.event).toBe(event);
    expect(details.trigger).toBe(trigger);
  });

  it("省略事件与触发元素时为 undefined", () => {
    const details = createDrawerChangeEventDetails("none");

    expect(details.event).toBeUndefined();
    expect(details.trigger).toBeUndefined();
  });

  it("isCanceled 是即时 getter：cancel() 之后立刻可读", () => {
    const details = createDrawerChangeEventDetails("escape-key");

    expect(details.isCanceled).toBe(false);
    details.cancel();
    expect(details.isCanceled).toBe(true);
  });

  it("allowPropagation 与 cancel 相互独立", () => {
    const details = createDrawerChangeEventDetails("outside-press");

    details.allowPropagation();

    expect(details.isPropagationAllowed).toBe(true);
    expect(details.isCanceled).toBe(false);
  });
});
