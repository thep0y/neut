import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "~/components/sidebar/Sidebar/Sidebar";
import { SidebarContent } from "~/components/sidebar/SidebarContent/SidebarContent";
import { SidebarProvider } from "~/components/sidebar/SidebarProvider/SidebarProvider";
import { useSidebar } from "~/components/sidebar/SidebarProvider";

function stubMobileMatchMedia() {
  const media = {
    matches: true,
    media: "(max-width: 767px)",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;

  vi.stubGlobal("matchMedia", () => media);
}

function OpenButton() {
  const { setOpenMobile } = useSidebar();
  return (
    <button
      type="button"
      data-testid="open-mobile"
      onClick={() => setOpenMobile(true)}
    >
      open
    </button>
  );
}

function MobileSidebar(props: {
  side?: "left" | "right";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  return (
    <SidebarProvider>
      <OpenButton />
      <Sidebar side={props.side} collapsible={props.collapsible ?? "offcanvas"}>
        <SidebarContent>
          <span data-testid="sidebar-child">导航内容</span>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("Sidebar - 移动端 Sheet", () => {
  it("移动端默认不渲染桌面侧边栏，也不挂载 Sheet", () => {
    stubMobileMatchMedia();
    render(() => <MobileSidebar />);

    expect(document.querySelector('[data-slot="sidebar"]')).toBeNull();
    expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
  });

  it("打开 openMobile 后渲染 Sheet，并复用 children", () => {
    stubMobileMatchMedia();
    render(() => <MobileSidebar />);

    fireEvent.click(document.querySelector('[data-testid="open-mobile"]')!);

    const sheet = document.querySelector(
      '[data-slot="sheet-content"]',
    ) as HTMLElement;
    expect(sheet).not.toBeNull();
    expect(sheet).toHaveAttribute("data-mobile", "true");
    expect(sheet).toHaveAttribute("data-sidebar", "sidebar");
    expect(sheet).toHaveAttribute("data-side", "left");
    expect(
      sheet.querySelector('[data-testid="sidebar-child"]'),
    ).toHaveTextContent("导航内容");
  });

  it("side=right 时 Sheet 跟随右侧", () => {
    stubMobileMatchMedia();
    render(() => <MobileSidebar side="right" />);

    fireEvent.click(document.querySelector('[data-testid="open-mobile"]')!);

    const sheet = document.querySelector(
      '[data-slot="sheet-content"]',
    ) as HTMLElement;
    expect(sheet).toHaveAttribute("data-side", "right");
  });

  it("collapsible=none 在移动端仍退化为普通容器", () => {
    stubMobileMatchMedia();
    render(() => <MobileSidebar collapsible="none" />);

    const shell = document.querySelector(
      '[data-slot="sidebar"]',
    ) as HTMLElement;
    expect(shell).not.toBeNull();
    expect(shell).toHaveTextContent("导航内容");
    expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
  });
});
