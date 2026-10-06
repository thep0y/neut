import { describe, expect, it } from "vitest";
import { createTimePickerChangeEventDetails } from "~/components/time-picker/TimePicker/create-change-event-details";

describe("createTimePickerChangeEventDetails", () => {
  it("透传 reason / event / trigger", () => {
    const event = new Event("click");
    const trigger = document.createElement("div");

    const details = createTimePickerChangeEventDetails(
      "option-press",
      event,
      trigger,
    );

    expect(details.reason).toBe("option-press");
    expect(details.event).toBe(event);
    expect(details.trigger).toBe(trigger);
  });

  it("不带 event / trigger 时两者都是 undefined", () => {
    const details = createTimePickerChangeEventDetails("keyboard");

    expect(details.event).toBeUndefined();
    expect(details.trigger).toBeUndefined();
  });

  it("cancel() 立即把 isCanceled 置为 true（getter 语义，不是快照）", () => {
    const details = createTimePickerChangeEventDetails("none");

    expect(details.isCanceled).toBe(false);
    details.cancel();
    expect(details.isCanceled).toBe(true);
  });

  it("allowPropagation() 独立于 cancel()，互不影响", () => {
    const details = createTimePickerChangeEventDetails("clear");

    details.allowPropagation();
    expect(details.isPropagationAllowed).toBe(true);
    expect(details.isCanceled).toBe(false);
  });
});
