import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { DrawerHeader } from "~/components/drawer/DrawerHeader/DrawerHeader";

function header(): HTMLElement {
  return document.querySelector('[data-slot="drawer-header"]') as HTMLElement;
}

describe("DrawerHeader", () => {
  it("渲染带 data-slot 的容器并容纳 children", () => {
    render(() => <DrawerHeader>标题区</DrawerHeader>);

    expect(header().tagName).toBe("DIV");
    expect(header()).toHaveAttribute("data-slot", "drawer-header");
    expect(header()).toHaveTextContent("标题区");
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    render(() => (
      <DrawerHeader
        class="my-header"
        classList={{ "is-tight": true }}
        data-testid="header-extra"
      />
    ));

    expect(header()).toHaveClass("my-header");
    expect(header()).toHaveClass("is-tight");
    expect(header()).toHaveAttribute("data-testid", "header-extra");
  });
});
