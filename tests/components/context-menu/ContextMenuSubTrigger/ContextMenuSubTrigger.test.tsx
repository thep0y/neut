import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextMenu } from "~/components/context-menu/ContextMenu/ContextMenu";
import { ContextMenuContent } from "~/components/context-menu/ContextMenuContent/ContextMenuContent";
import { ContextMenuItem } from "~/components/context-menu/ContextMenuItem/ContextMenuItem";
import { ContextMenuSub } from "~/components/context-menu/ContextMenuSub/ContextMenuSub";
import { ContextMenuSubContent } from "~/components/context-menu/ContextMenuSubContent/ContextMenuSubContent";
import { ContextMenuSubTrigger } from "~/components/context-menu/ContextMenuSubTrigger/ContextMenuSubTrigger";
import { ContextMenuTrigger } from "~/components/context-menu/ContextMenuTrigger/ContextMenuTrigger";
import { slot, waitForMount } from "../test-utils";

function subTrigger(): HTMLElement {
  return slot("context-menu-sub-trigger")!;
}

function subContent(): HTMLElement | null {
  return slot("context-menu-sub-content");
}

function renderSubMenu(
  options: {
    subTriggerProps?: Record<string, unknown>;
    subProps?: Record<string, unknown>;
  } = {},
) {
  return render(() => (
    <ContextMenu defaultOpen>
      <ContextMenuTrigger>区域</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>普通项</ContextMenuItem>
        <ContextMenuSub {...(options.subProps ?? {})}>
          <ContextMenuSubTrigger {...(options.subTriggerProps ?? {})}>
            更多
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>子项</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  ));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ContextMenuSubTrigger - 渲染与 ARIA", () => {
  it("渲染 role=menuitem 且 aria-haspopup=menu，附带右向箭头", async () => {
    renderSubMenu();
    await waitForMount();

    expect(subTrigger()).toHaveAttribute("role", "menuitem");
    expect(subTrigger()).toHaveAttribute("aria-haspopup", "menu");
    expect(subTrigger()).toHaveAttribute("tabindex", "-1");
    expect(subTrigger()).toHaveAttribute(
      "data-slot",
      "context-menu-sub-trigger",
    );
    expect(subTrigger().querySelector("svg")).toBeInTheDocument();
  });

  it("初始 aria-expanded=false 且没有 data-open", async () => {
    renderSubMenu();
    await waitForMount();

    expect(subTrigger()).toHaveAttribute("aria-expanded", "false");
    expect(subTrigger()).not.toHaveAttribute("data-open");
  });

  it("inset / disabled 的状态属性", async () => {
    renderSubMenu({ subTriggerProps: { inset: true, disabled: true } });
    await waitForMount();

    expect(subTrigger()).toHaveAttribute("data-inset", "");
    expect(subTrigger()).toHaveAttribute("data-disabled", "");
    expect(subTrigger()).toHaveAttribute("aria-disabled", "true");
  });

  it("子菜单根 disabled 时触发器也禁用", async () => {
    renderSubMenu({ subProps: { disabled: true } });
    await waitForMount();

    expect(subTrigger()).toHaveAttribute("data-disabled", "");
    expect(subTrigger()).toHaveAttribute("aria-disabled", "true");
  });

  it("子菜单根 disabled 时点击与悬停都不打开", async () => {
    renderSubMenu({ subProps: { disabled: true } });
    await waitForMount();

    fireEvent.click(subTrigger());
    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(200);

    expect(subTrigger()).toHaveAttribute("aria-expanded", "false");
    expect(subContent()).toBeNull();
  });
});

describe("ContextMenuSubTrigger - 点击开关", () => {
  it("点击打开子菜单，aria-expanded 与 data-open 同步", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.click(subTrigger());

    expect(subTrigger()).toHaveAttribute("aria-expanded", "true");
    expect(subTrigger()).toHaveAttribute("data-open", "");
    expect(subContent()).toBeInTheDocument();
  });

  it("已打开时再次点击关闭（trigger-press）", async () => {
    renderSubMenu();
    await waitForMount();
    fireEvent.click(subTrigger());
    expect(subContent()).toBeInTheDocument();

    fireEvent.click(subTrigger());

    expect(subTrigger()).toHaveAttribute("aria-expanded", "false");
    expect(subContent()).toBeNull();
  });

  it("disabled 时点击不打开", async () => {
    renderSubMenu({ subTriggerProps: { disabled: true } });
    await waitForMount();

    fireEvent.click(subTrigger());

    expect(subContent()).toBeNull();
  });

  it("onClick 里 preventDefault 阻止开关", async () => {
    renderSubMenu({
      subTriggerProps: {
        onClick: (event: MouseEvent) => event.preventDefault(),
      },
    });
    await waitForMount();

    fireEvent.click(subTrigger());

    expect(subContent()).toBeNull();
  });

  it("用户自己的 onClick 会被调用", async () => {
    const onClick = vi.fn();
    renderSubMenu({ subTriggerProps: { onClick } });
    await waitForMount();

    fireEvent.click(subTrigger());

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("ContextMenuSubTrigger - 悬停开关", () => {
  it("悬停默认 100ms 后以 trigger-hover 打开", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(99);
    expect(subContent()).toBeNull();

    await vi.advanceTimersByTimeAsync(1);

    expect(subTrigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("delay 可自定义", async () => {
    renderSubMenu({ subTriggerProps: { delay: 300 } });
    await waitForMount();

    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(299);
    expect(subContent()).toBeNull();

    await vi.advanceTimersByTimeAsync(1);

    expect(subContent()).toBeInTheDocument();
  });

  it("openOnHover=false 时悬停不打开，点击仍可打开", async () => {
    renderSubMenu({ subTriggerProps: { openOnHover: false } });
    await waitForMount();

    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(200);
    expect(subContent()).toBeNull();

    fireEvent.click(subTrigger());

    expect(subContent()).toBeInTheDocument();
  });

  it("disabled 时悬停不打开", async () => {
    renderSubMenu({ subTriggerProps: { disabled: true } });
    await waitForMount();

    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(200);

    expect(subContent()).toBeNull();
  });

  it("已经打开时悬停不再排新的打开定时器", async () => {
    renderSubMenu();
    await waitForMount();
    fireEvent.click(subTrigger());

    fireEvent.pointerEnter(subTrigger());
    fireEvent.pointerLeave(subTrigger());
    await vi.advanceTimersByTimeAsync(200);

    // 打开状态下 pointerEnter 不排新的打开定时器；pointerLeave 排期关闭
    expect(subContent()).toBeNull();
  });

  it("pointerLeave 在已打开时排期关闭", async () => {
    renderSubMenu();
    await waitForMount();
    fireEvent.click(subTrigger());
    expect(subContent()).toBeInTheDocument();

    fireEvent.pointerLeave(subTrigger());
    await vi.advanceTimersByTimeAsync(100);

    expect(subContent()).toBeNull();
  });

  it("pointerLeave 在未打开时不排期", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.pointerLeave(subTrigger());
    await vi.advanceTimersByTimeAsync(200);

    expect(subContent()).toBeNull();
  });

  it("指针移入会取消父级已排期的关闭", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(100);
    expect(subContent()).toBeInTheDocument();

    // 关闭的宽限期内再次移入：cancelClose 会取消待关闭
    fireEvent.pointerLeave(subTrigger());
    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(200);

    expect(subContent()).toBeInTheDocument();
  });
});

describe("ContextMenuSubTrigger - 键盘与指针补充", () => {
  it("高亮到子菜单触发器后按 ArrowRight 以 list-navigation 打开", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.keyDown(slot("context-menu-content")!, { key: "End" });
    expect(subTrigger()).toHaveAttribute("data-highlighted", "");

    fireEvent.keyDown(slot("context-menu-content")!, { key: "ArrowRight" });

    expect(subTrigger()).toHaveAttribute("aria-expanded", "true");
    expect(subContent()).toBeInTheDocument();
  });

  it("字符导航按触发器文本匹配", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.keyDown(slot("context-menu-content")!, { key: "更" });

    expect(subTrigger()).toHaveAttribute("data-highlighted", "");
  });

  it("在触发器内移动指针也会高亮", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.pointerMove(subTrigger());

    expect(subTrigger()).toHaveAttribute("data-highlighted", "");
  });

  it("悬停后立即移出会撤销尚未触发的打开定时器", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.pointerEnter(subTrigger());
    fireEvent.pointerLeave(subTrigger());
    await vi.advanceTimersByTimeAsync(300);

    expect(subContent()).toBeNull();
  });
});

describe("ContextMenuSubTrigger - 高亮切换关闭子菜单", () => {
  it("父浮层高亮切到别的项时以 list-navigation 关闭子菜单", async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <ContextMenu defaultOpen>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>普通项</ContextMenuItem>
          <ContextMenuSub onOpenChange={onOpenChange}>
            <ContextMenuSubTrigger>更多</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>子项</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    ));
    await waitForMount();
    fireEvent.click(subTrigger());
    expect(subContent()).toBeInTheDocument();

    fireEvent.pointerEnter(slot("context-menu-item")!);

    expect(subContent()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "list-navigation" }),
    );
  });
});
