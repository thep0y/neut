import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarSeparator } from "~/components/sidebar/SidebarSeparator/SidebarSeparator";

function separator(): HTMLElement {
  return document.querySelector(
    '[data-slot="sidebar-separator"]',
  ) as HTMLElement;
}

describe("SidebarSeparator", () => {
  it("覆盖 Separator 的 data-slot 并保留侧边栏语义", () => {
    render(() => <SidebarSeparator />);

    expect(separator()).toHaveAttribute("data-sidebar", "separator");
    expect(separator()).toHaveAttribute("data-orientation", "horizontal");
  });

  it("class 参与合并", () => {
    render(() => <SidebarSeparator class="my-4" />);

    expect(separator()).toHaveClass(
      "mx-2",
      "w-auto",
      "bg-sidebar-border",
      "my-4",
    );
  });

  it("把 orientation 透传给底层 Separator", () => {
    render(() => <SidebarSeparator orientation="vertical" />);

    expect(separator()).toHaveAttribute("data-orientation", "vertical");
    expect(separator()).toHaveAttribute("data-vertical", "");
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarSeparator classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(separator()).toHaveClass("keep-me");
    expect(separator()).not.toHaveClass("drop-me");
  });
});
