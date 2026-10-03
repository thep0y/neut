import { fireEvent } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DropdownMenuItem } from "~/components/dropdown-menu/DropdownMenuItem/DropdownMenuItem";
import { renderOpenMenu, slot, slots, waitForMount } from "../test-utils";

describe("DropdownMenuItem - 字符导航", () => {
  it("label 属性优先于子节点文本参与匹配", async () => {
    renderOpenMenu(() => (
      <>
        <DropdownMenuItem label="zeta">第一个</DropdownMenuItem>
        <DropdownMenuItem>第二个</DropdownMenuItem>
      </>
    ));
    await waitForMount();

    fireEvent.keyDown(slot("dropdown-menu-content")!, { key: "z" });

    const items = slots("dropdown-menu-item");
    expect(items[0]).toHaveAttribute("data-highlighted", "");
    expect(items[1]).not.toHaveAttribute("data-highlighted");
  });

  it("没有 label 时回退到子节点文本匹配", async () => {
    renderOpenMenu(() => (
      <>
        <DropdownMenuItem>苹果</DropdownMenuItem>
        <DropdownMenuItem>香蕉</DropdownMenuItem>
      </>
    ));
    await waitForMount();

    fireEvent.keyDown(slot("dropdown-menu-content")!, { key: "香" });

    expect(slots("dropdown-menu-item")[1]).toHaveAttribute(
      "data-highlighted",
      "",
    );
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
