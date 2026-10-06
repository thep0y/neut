import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ContextMenuGroup } from "~/components/context-menu/ContextMenuGroup/ContextMenuGroup";
import { ContextMenuLabel } from "~/components/context-menu/ContextMenuLabel/ContextMenuLabel";
import { slot } from "../test-utils";

describe("ContextMenuGroup", () => {
  it("渲染 role=group 的容器并透传 class 与原生属性", () => {
    render(() => (
      <ContextMenuGroup class="my-group" data-x="1">
        <span>内容</span>
      </ContextMenuGroup>
    ));

    const group = slot("context-menu-group")!;
    expect(group).toHaveAttribute("role", "group");
    expect(group).toHaveAttribute("data-slot", "context-menu-group");
    expect(group.className).toContain("my-group");
    expect(group).toHaveAttribute("data-x", "1");
    expect(group).toHaveTextContent("内容");
  });

  it("没有 Label 时 aria-labelledby 不出现", () => {
    render(() => <ContextMenuGroup>内容</ContextMenuGroup>);

    expect(slot("context-menu-group")).not.toHaveAttribute("aria-labelledby");
  });

  it("组内 Label 的 id 写到 aria-labelledby", () => {
    render(() => (
      <ContextMenuGroup>
        <ContextMenuLabel>标题</ContextMenuLabel>
      </ContextMenuGroup>
    ));

    const group = slot("context-menu-group")!;
    expect(group).toHaveAttribute(
      "aria-labelledby",
      slot("context-menu-label")!.id,
    );
  });

  it("嵌套时内层 Label 关联最近的内层 Group", () => {
    render(() => (
      <ContextMenuGroup>
        <ContextMenuGroup>
          <ContextMenuLabel>内层标题</ContextMenuLabel>
        </ContextMenuGroup>
      </ContextMenuGroup>
    ));

    const groups = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-slot="context-menu-group"]',
      ),
    );
    expect(groups[0]).not.toHaveAttribute("aria-labelledby");
    expect(groups[1]).toHaveAttribute(
      "aria-labelledby",
      slot("context-menu-label")!.id,
    );
  });
});
