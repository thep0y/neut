import { render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarMenuSkeleton } from "~/components/sidebar/SidebarMenuSkeleton/SidebarMenuSkeleton";

function root(): HTMLElement {
  return document.querySelector(
    '[data-slot="sidebar-menu-skeleton"]',
  ) as HTMLElement;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SidebarMenuSkeleton", () => {
  it("渲染骨架容器与文字骨架条", () => {
    render(() => <SidebarMenuSkeleton />);

    expect(root()).toHaveAttribute("data-sidebar", "menu-skeleton");
    expect(
      document.querySelectorAll('[data-sidebar="menu-skeleton-text"]'),
    ).toHaveLength(1);
    expect(
      document.querySelector('[data-sidebar="menu-skeleton-icon"]'),
    ).toBeNull();
  });

  it("showIcon 为 true 时额外渲染图标骨架", () => {
    render(() => <SidebarMenuSkeleton showIcon />);

    const icon = document.querySelector('[data-sidebar="menu-skeleton-icon"]');
    expect(icon).not.toBeNull();
    expect(icon).toHaveClass("size-4", "rounded-md");
  });

  it("骨架宽度由随机数决定（50%~89%）", () => {
    // Math.random 是系统边界上的非确定性来源，固定它才能断言具体宽度。
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(() => <SidebarMenuSkeleton />);

    const text = document.querySelector(
      '[data-sidebar="menu-skeleton-text"]',
    ) as HTMLElement;
    expect(text.style.getPropertyValue("--skeleton-width")).toBe("70%");
  });

  it("class 与 classList 参与合并", () => {
    render(() => (
      <SidebarMenuSkeleton
        class="h-10"
        classList={{ "keep-me": true, "drop-me": false }}
      />
    ));

    expect(root()).toHaveClass(
      "flex",
      "items-center",
      "gap-2",
      "rounded-md",
      "h-10",
    );
    expect(root()).toHaveClass("keep-me");
    expect(root()).not.toHaveClass("drop-me");
  });
});
