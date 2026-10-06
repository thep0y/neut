import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ContextMenuSeparator } from "~/components/context-menu/ContextMenuSeparator/ContextMenuSeparator";
import { slot } from "../test-utils";

describe("ContextMenuSeparator", () => {
  it("默认水平分隔线：role=separator + aria-orientation=horizontal", () => {
    render(() => <ContextMenuSeparator />);

    const separator = slot("context-menu-separator")!;
    expect(separator).toHaveAttribute("role", "separator");
    expect(separator).toHaveAttribute("aria-orientation", "horizontal");
    expect(separator).toHaveAttribute("data-slot", "context-menu-separator");
    expect(separator).toHaveAttribute("data-orientation", "horizontal");
  });

  it("orientation=vertical 时同步到 aria 与 data 属性", () => {
    render(() => <ContextMenuSeparator orientation="vertical" />);

    const separator = slot("context-menu-separator")!;
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
    expect(separator).toHaveAttribute("data-vertical", "");
  });

  it("class 合并、原生属性透传", () => {
    render(() => <ContextMenuSeparator class="my-separator" data-x="1" />);

    const separator = slot("context-menu-separator")!;
    expect(separator.className).toContain("my-separator");
    expect(separator.className).toContain("-mx-1");
    expect(separator).toHaveAttribute("data-x", "1");
  });
});
