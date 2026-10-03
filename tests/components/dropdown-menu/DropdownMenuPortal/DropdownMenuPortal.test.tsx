import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { DropdownMenuPortal } from "~/components/dropdown-menu/DropdownMenuPortal/DropdownMenuPortal";

describe("DropdownMenuPortal", () => {
  it("默认把子节点挂到 body，并带自己的 data-slot", () => {
    const { container } = render(() => (
      <DropdownMenuPortal>
        <span data-x="portaled">浮层内容</span>
      </DropdownMenuPortal>
    ));

    const portal = document.querySelector<HTMLElement>(
      '[data-slot="dropdown-menu-portal"]',
    )!;
    const portaled = document.querySelector('[data-x="portaled"]')!;
    expect(portal.contains(portaled)).toBe(true);
    expect(portaled).toHaveTextContent("浮层内容");
    expect(container.contains(portal)).toBe(false);
  });

  it("class 与其余原生属性透传到容器上", () => {
    render(() => (
      <DropdownMenuPortal class="my-portal" data-x="1">
        <span>内容</span>
      </DropdownMenuPortal>
    ));

    const portal = document.querySelector<HTMLElement>(
      '[data-slot="dropdown-menu-portal"]',
    )!;
    expect(portal.className).toContain("my-portal");
    expect(portal).toHaveAttribute("data-x", "1");
  });
});
