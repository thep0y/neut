import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { DropdownMenuGroup } from "~/components/dropdown-menu/DropdownMenuGroup/DropdownMenuGroup";
import { DropdownMenuLabel } from "~/components/dropdown-menu/DropdownMenuLabel/DropdownMenuLabel";
import { slot, slots } from "../test-utils";

describe("DropdownMenuGroup", () => {
  it("渲染 role=group 的容器并透传 class 与原生属性", () => {
    render(() => (
      <DropdownMenuGroup class="my-group" data-x="1">
        <span>内容</span>
      </DropdownMenuGroup>
    ));

    const group = slot("dropdown-menu-group")!;
    expect(group).toHaveAttribute("role", "group");
    expect(group).toHaveAttribute("data-slot", "dropdown-menu-group");
    expect(group.className).toContain("my-group");
    expect(group).toHaveAttribute("data-x", "1");
    expect(group).toHaveTextContent("内容");
  });

  it("没有 Label 时 aria-labelledby 不出现", () => {
    render(() => <DropdownMenuGroup>内容</DropdownMenuGroup>);

    expect(slot("dropdown-menu-group")).not.toHaveAttribute("aria-labelledby");
  });

  it("组内 Label 的 id 写到 aria-labelledby，双向关联成立", () => {
    render(() => (
      <DropdownMenuGroup>
        <DropdownMenuLabel>标题</DropdownMenuLabel>
      </DropdownMenuGroup>
    ));

    const group = slot("dropdown-menu-group")!;
    const label = slot("dropdown-menu-label")!;
    expect(group).toHaveAttribute("aria-labelledby", label.id);
    expect(
      document.getElementById(group.getAttribute("aria-labelledby")!),
    ).toBe(label);
  });

  it("嵌套时内层 Label 关联最近的内层 Group", () => {
    render(() => (
      <DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuLabel>内层标题</DropdownMenuLabel>
        </DropdownMenuGroup>
      </DropdownMenuGroup>
    ));

    const groups = slots("dropdown-menu-group");
    expect(groups[0]).not.toHaveAttribute("aria-labelledby");
    expect(groups[1]).toHaveAttribute(
      "aria-labelledby",
      slot("dropdown-menu-label")!.id,
    );
  });
});
