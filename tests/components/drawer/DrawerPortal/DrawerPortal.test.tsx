import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { DrawerPortal } from "~/components/drawer/DrawerPortal/DrawerPortal";

describe("DrawerPortal", () => {
  it("把内容渲染到 document.body 之外的位置（Portal 到 body）", () => {
    const { container } = render(() => (
      <DrawerPortal>
        <span>门户内容</span>
      </DrawerPortal>
    ));

    expect(container.querySelector('[data-slot="drawer-portal"]')).toBeNull();
    const portal = document.body.querySelector(
      '[data-slot="drawer-portal"]',
    ) as HTMLElement;
    expect(portal).not.toBeNull();
    expect(portal.querySelector("span")).toHaveTextContent("门户内容");
  });

  it("透传其余属性到门户容器", () => {
    render(() => <DrawerPortal id="my-portal" data-testid="portal" />);

    const portal = document.body.querySelector(
      '[data-slot="drawer-portal"]',
    ) as HTMLElement;
    expect(portal).toHaveAttribute("id", "my-portal");
    expect(portal).toHaveAttribute("data-testid", "portal");
  });
});
