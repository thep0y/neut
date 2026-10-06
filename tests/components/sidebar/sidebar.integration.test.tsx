import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "~/components/sidebar/Sidebar/Sidebar";
import { SidebarContent } from "~/components/sidebar/SidebarContent/SidebarContent";
import { SidebarFooter } from "~/components/sidebar/SidebarFooter/SidebarFooter";
import { SidebarGroup } from "~/components/sidebar/SidebarGroup/SidebarGroup";
import { SidebarGroupContent } from "~/components/sidebar/SidebarGroupContent/SidebarGroupContent";
import { SidebarGroupLabel } from "~/components/sidebar/SidebarGroupLabel/SidebarGroupLabel";
import { SidebarHeader } from "~/components/sidebar/SidebarHeader/SidebarHeader";
import { SidebarInset } from "~/components/sidebar/SidebarInset/SidebarInset";
import { SidebarMenu } from "~/components/sidebar/SidebarMenu/SidebarMenu";
import { SidebarMenuBadge } from "~/components/sidebar/SidebarMenuBadge/SidebarMenuBadge";
import { SidebarMenuButton } from "~/components/sidebar/SidebarMenuButton/SidebarMenuButton";
import { SidebarMenuItem } from "~/components/sidebar/SidebarMenuItem/SidebarMenuItem";
import { SidebarMenuSub } from "~/components/sidebar/SidebarMenuSub/SidebarMenuSub";
import { SidebarMenuSubButton } from "~/components/sidebar/SidebarMenuSubButton/SidebarMenuSubButton";
import { SidebarMenuSubItem } from "~/components/sidebar/SidebarMenuSubItem/SidebarMenuSubItem";
import { SidebarProvider } from "~/components/sidebar/SidebarProvider/SidebarProvider";
import { SidebarRail } from "~/components/sidebar/SidebarRail/SidebarRail";
import { SidebarTrigger } from "~/components/sidebar/SidebarTrigger/SidebarTrigger";

/**
 * 组合行为：Provider + Sidebar + Trigger/Rail + Menu 全家族。
 *
 * 重点验证"折叠状态"这一条主链路在整棵树上联动：
 * Provider 的 open → Sidebar 外壳的 data-state → 菜单按钮是否可见/可点 →
 * 触发器点击 / Ctrl+B / 轨道点击都能反向驱动 Provider。
 */

function clearCookies() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name) {
      // biome-ignore lint/suspicious/noDocumentCookie: 测试需要真实读写 cookie（jsdom 支持）
      document.cookie = `${name}=; path=/; max-age=0`;
    }
  }
}

/** 一个接近真实用法的侧边栏应用骨架。 */
function DemoApp() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarTrigger aria-label="切换侧边栏" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>导航</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>首页</SidebarMenuButton>
                  <SidebarMenuBadge>2</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="设置">设置</SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="/profile">
                        个人资料
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarRail />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <p>正文内容</p>
      </SidebarInset>
    </SidebarProvider>
  );
}

function shell(): HTMLElement {
  return document.querySelector('[data-slot="sidebar"]') as HTMLElement;
}

function trigger(): HTMLElement {
  return document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement;
}

function rail(): HTMLElement {
  return document.querySelector('[data-slot="sidebar-rail"]') as HTMLElement;
}

function ctrlB() {
  const event = new KeyboardEvent("keydown", {
    key: "b",
    ctrlKey: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  clearCookies();
});

afterEach(() => {
  clearCookies();
  vi.restoreAllMocks();
});

describe("sidebar 集成 - 初始渲染", () => {
  it("整棵树渲染完整，外壳为 expanded、icon 折叠模式", () => {
    render(() => <DemoApp />);

    expect(shell()).toHaveAttribute("data-state", "expanded");
    expect(shell()).toHaveAttribute("data-collapsible", "");
    const inner = document.querySelector('[data-slot="sidebar-inner"]');
    expect(
      inner?.contains(
        document.querySelector('[data-slot="sidebar-menu-button"]'),
      ),
    ).toBe(true);
    // 折叠模式的图标/轨道/内容
    expect(document.querySelector('[data-slot="sidebar-rail"]')).not.toBeNull();
    expect(
      document.querySelector('[data-slot="sidebar-inset"]'),
    ).toHaveTextContent("正文内容");
  });

  it("active 菜单按钮与子按钮都渲染出状态属性", () => {
    render(() => <DemoApp />);

    expect(
      document.querySelector(
        '[data-slot="sidebar-menu-button"][data-active="true"]',
      ),
    ).toHaveTextContent("首页");
    expect(
      document.querySelector('[data-slot="sidebar-menu-sub-button"]'),
    ).toHaveAttribute("data-active", "false");
  });
});

describe("sidebar 集成 - 折叠联动", () => {
  it("点击 Trigger 折叠后，外壳与按钮状态同步变化并写 cookie", () => {
    render(() => <DemoApp />);

    fireEvent.click(trigger());

    expect(shell()).toHaveAttribute("data-state", "collapsed");
    expect(shell()).toHaveAttribute("data-collapsible", "icon");
    expect(document.cookie).toContain("sidebar_state=false");
  });

  it("Ctrl+B 快捷键折叠，再按一次展开", async () => {
    render(() => <DemoApp />);
    await Promise.resolve();

    expect(ctrlB().defaultPrevented).toBe(true);
    expect(shell()).toHaveAttribute("data-state", "collapsed");

    ctrlB();
    expect(shell()).toHaveAttribute("data-state", "expanded");
  });

  it("点击 Rail 同样折叠侧边栏", () => {
    render(() => <DemoApp />);

    fireEvent.click(rail());

    expect(shell()).toHaveAttribute("data-state", "collapsed");
  });

  it("展开态下菜单按钮的 tooltip 浮层带 hidden", async () => {
    render(() => <DemoApp />);

    const settings = Array.from(
      document.querySelectorAll('[data-slot="sidebar-menu-button"]'),
    ).find((el) => el.textContent?.includes("设置")) as HTMLElement;

    fireEvent.focus(settings);
    await new Promise((resolve) => setTimeout(resolve, 30));

    const tooltip = document.querySelector('[role="tooltip"]');
    expect(tooltip).not.toBeNull();
    expect(tooltip).toHaveTextContent("设置");
    expect(tooltip).toHaveAttribute("hidden");
  });
});

describe("sidebar 集成 - 受控模式", () => {
  it("受控下 Trigger 触发 onOpenChange，外部回写后 UI 跟随", () => {
    const [open, setOpen] = createSignal(true);
    const onOpenChange = vi.fn();

    render(() => (
      <SidebarProvider
        open={open()}
        onOpenChange={(next) => {
          onOpenChange(next);
          setOpen(next);
        }}
      >
        <Sidebar>
          <SidebarHeader>
            <SidebarTrigger aria-label="切换" />
          </SidebarHeader>
        </Sidebar>
      </SidebarProvider>
    ));

    fireEvent.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // 外部回写后 UI 跟随
    expect(shell()).toHaveAttribute("data-state", "collapsed");
  });
});
