import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { SidebarGroupAction } from "~/components/sidebar/SidebarGroupAction/SidebarGroupAction";

function action(): HTMLElement {
  return document.querySelector(
    '[data-slot="sidebar-group-action"]',
  ) as HTMLElement;
}

describe("SidebarGroupAction", () => {
  it("默认渲染为 button 并带 data-sidebar", () => {
    render(() => <SidebarGroupAction>新增</SidebarGroupAction>);

    expect(action().tagName).toBe("BUTTON");
    expect(action()).toHaveAttribute("data-sidebar", "group-action");
    expect(action()).toHaveTextContent("新增");
  });

  it("class 与 classList 参与合并", () => {
    render(() => (
      <SidebarGroupAction
        class="top-4"
        classList={{ "keep-me": true, "drop-me": false }}
      />
    ));

    expect(action()).toHaveClass("absolute", "aspect-square", "flex", "top-4");
    expect(action()).toHaveClass("keep-me");
    expect(action()).not.toHaveClass("drop-me");
  });

  it("component 可切换为自定义标签并透传事件", () => {
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    render(() => (
      <SidebarGroupAction component="a" href="/new" onClick={onClick}>
        新增
      </SidebarGroupAction>
    ));

    expect(action().tagName).toBe("A");
    expect(action()).toHaveAttribute("href", "/new");

    fireEvent.click(action());
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
