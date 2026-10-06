import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { SidebarInput } from "~/components/sidebar/SidebarInput/SidebarInput";

function input(): HTMLInputElement {
  return document.querySelector(
    '[data-slot="sidebar-input"]',
  ) as HTMLInputElement;
}

describe("SidebarInput", () => {
  it("渲染带侧边栏语义的 input", () => {
    render(() => <SidebarInput />);

    expect(input().tagName).toBe("INPUT");
    expect(input()).toHaveAttribute("data-sidebar", "input");
  });

  it("class 参与合并", () => {
    render(() => <SidebarInput class="h-10" />);

    expect(input()).toHaveClass(
      "w-full",
      "bg-background",
      "shadow-none",
      "h-10",
    );
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarInput classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(input()).toHaveClass("keep-me");
    expect(input()).not.toHaveClass("drop-me");
  });

  it("透传原生属性并回调输入值", () => {
    const onInput = vi.fn();
    render(() => (
      <SidebarInput id="search" placeholder="搜索" onInput={onInput} />
    ));

    expect(input()).toHaveAttribute("id", "search");
    expect(input()).toHaveAttribute("placeholder", "搜索");

    fireEvent.input(input(), { target: { value: "关键词" } });

    expect(onInput).toHaveBeenCalledWith("关键词");
  });
});
