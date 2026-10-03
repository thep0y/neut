import { describe, expect, it } from "vitest";
import { toPlacement } from "~/components/combobox/ComboboxContent/ComboboxContent.utils";

describe("toPlacement", () => {
  it("align=center 时退化为纯方向", () => {
    expect(toPlacement("bottom", "center")).toBe("bottom");
  });

  it("align=start 时拼成 side-align", () => {
    expect(toPlacement("top", "start")).toBe("top-start");
  });

  it("align=end 时拼成 side-align", () => {
    expect(toPlacement("left", "end")).toBe("left-end");
  });
});
