import { render } from "@solidjs/testing-library";
import { createSignal, Show } from "solid-js";
import { describe, expect, it } from "vitest";
import { DropdownMenuGroup } from "~/components/dropdown-menu/DropdownMenuGroup/DropdownMenuGroup";
import { DropdownMenuLabel } from "~/components/dropdown-menu/DropdownMenuLabel/DropdownMenuLabel";
import { slot } from "../test-utils";

describe("DropdownMenuLabel", () => {
  it("渲染带 id 的标题，透传 class / inset / 原生属性", () => {
    render(() => (
      <DropdownMenuLabel class="my-label" inset data-x="1">
        分组标题
      </DropdownMenuLabel>
    ));

    const label = slot("dropdown-menu-label")!;
    expect(label.id).toMatch(/^dropdown-menu-label-/);
    expect(label).toHaveAttribute("data-slot", "dropdown-menu-label");
    expect(label).toHaveAttribute("data-inset", "");
    expect(label).toHaveAttribute("data-x", "1");
    expect(label.className).toContain("my-label");
    expect(label).toHaveTextContent("分组标题");
  });

  it("不套 Group 也能独立渲染，且不带 data-inset", () => {
    render(() => <DropdownMenuLabel>独立标题</DropdownMenuLabel>);

    const label = slot("dropdown-menu-label")!;
    expect(label).toHaveTextContent("独立标题");
    expect(label).not.toHaveAttribute("data-inset");
  });

  it("同一组内后挂载的 Label 接管 aria-labelledby", () => {
    render(() => (
      <DropdownMenuGroup>
        <DropdownMenuLabel>第一个</DropdownMenuLabel>
        <DropdownMenuLabel>第二个</DropdownMenuLabel>
      </DropdownMenuGroup>
    ));

    const labels = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-slot="dropdown-menu-label"]',
      ),
    );
    expect(slot("dropdown-menu-group")).toHaveAttribute(
      "aria-labelledby",
      labels[1]!.id,
    );
  });

  it("组内 Label 卸载后 Group 的 aria-labelledby 被清理", () => {
    const [show, setShow] = createSignal(true);
    render(() => (
      <DropdownMenuGroup>
        <Show when={show()}>
          <DropdownMenuLabel>标题</DropdownMenuLabel>
        </Show>
      </DropdownMenuGroup>
    ));
    expect(slot("dropdown-menu-group")).toHaveAttribute("aria-labelledby");

    setShow(false);

    expect(slot("dropdown-menu-label")).toBeNull();
    expect(slot("dropdown-menu-group")).not.toHaveAttribute("aria-labelledby");
  });
});
