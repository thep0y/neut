import { fireEvent, render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DropdownMenu } from "~/components/dropdown-menu/DropdownMenu/DropdownMenu";
import { DropdownMenuCheckboxItem } from "~/components/dropdown-menu/DropdownMenuCheckboxItem/DropdownMenuCheckboxItem";
import { DropdownMenuContent } from "~/components/dropdown-menu/DropdownMenuContent/DropdownMenuContent";
import { DropdownMenuItem } from "~/components/dropdown-menu/DropdownMenuItem/DropdownMenuItem";
import { DropdownMenuLabel } from "~/components/dropdown-menu/DropdownMenuLabel/DropdownMenuLabel";
import { DropdownMenuRadioGroup } from "~/components/dropdown-menu/DropdownMenuRadioGroup/DropdownMenuRadioGroup";
import { DropdownMenuRadioItem } from "~/components/dropdown-menu/DropdownMenuRadioItem/DropdownMenuRadioItem";
import { DropdownMenuSeparator } from "~/components/dropdown-menu/DropdownMenuSeparator/DropdownMenuSeparator";
import { DropdownMenuShortcut } from "~/components/dropdown-menu/DropdownMenuShortcut/DropdownMenuShortcut";
import { DropdownMenuTrigger } from "~/components/dropdown-menu/DropdownMenuTrigger/DropdownMenuTrigger";

/**
 * DropdownMenu 集成测试。
 *
 * 它复用 context-menu 的菜单运行时（定位/注册表/键盘/子菜单），
 * 与 ContextMenu 的区别只有锚点来源（触发器元素 vs 鼠标坐标）。
 * 因此这里聚焦：开关与调用方回调、Trigger 键盘、菜单项点击后关闭、
 * 外点/Escape 关闭、ARIA、受控模式、上下文约束。
 */
function renderMenu(
  props: {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean, details?: unknown) => void;
    disabled?: boolean;
    modal?: boolean;
    items?: Array<{
      label: string;
      disabled?: boolean;
      closeOnClick?: boolean;
      onClick?: (e: MouseEvent) => void;
    }>;
  } = {},
) {
  const items = props.items ?? [{ label: "菜单项" }];
  return render(() => (
    <DropdownMenu
      defaultOpen={props.defaultOpen}
      open={props.open}
      onOpenChange={props.onOpenChange}
      disabled={props.disabled}
      modal={props.modal}
    >
      <DropdownMenuTrigger>打开菜单</DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item) => (
          <DropdownMenuItem
            disabled={item.disabled}
            closeOnClick={item.closeOnClick}
            onClick={item.onClick}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ));
}

function trigger(): HTMLElement {
  return document.querySelector(
    '[data-slot="dropdown-menu-trigger"]',
  ) as HTMLElement;
}

function content(): HTMLElement | null {
  return document.querySelector('[data-slot="dropdown-menu-content"]');
}

function items(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="dropdown-menu-item"]'),
  );
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("DropdownMenu - 开与关", () => {
  it("默认关闭：不渲染 content", () => {
    renderMenu();

    expect(content()).toBeNull();
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("defaultOpen 时初始打开", () => {
    renderMenu({ defaultOpen: true });

    expect(content()).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("点击 trigger 打开并回调 onOpenChange", async () => {
    const onOpenChange = vi.fn();
    renderMenu({ onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(content()).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("已打开时点击 trigger 关闭（toggle）", async () => {
    const onOpenChange = vi.fn();
    renderMenu({ defaultOpen: true, onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(content()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("disabled 时点击不打开", async () => {
    const onOpenChange = vi.fn();
    renderMenu({ disabled: true, onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(content()).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("事件详情的 reason 为 trigger-press", async () => {
    const onOpenChange = vi.fn();
    renderMenu({ onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    const details = onOpenChange.mock.calls[0][1] as { reason: string };
    expect(details.reason).toBe("trigger-press");
  });
});

describe("DropdownMenu - Trigger 键盘", () => {
  it.each(["ArrowDown", "ArrowUp", "Enter", " "])("关闭时按 %s 打开", (key) => {
    const onOpenChange = vi.fn();
    renderMenu({ onOpenChange });

    fireEvent.keyDown(trigger(), { key });

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("关闭时按其他键不打开", () => {
    const onOpenChange = vi.fn();
    renderMenu({ onOpenChange });

    fireEvent.keyDown(trigger(), { key: "a" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("已打开时按方向键不会重复打开", () => {
    const onOpenChange = vi.fn();
    renderMenu({ defaultOpen: true, onOpenChange });

    fireEvent.keyDown(trigger(), { key: "ArrowDown" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("disabled 时键盘不打开", () => {
    const onOpenChange = vi.fn();
    renderMenu({ disabled: true, onOpenChange });

    fireEvent.keyDown(trigger(), { key: "Enter" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("用户的 onClick 与内部 toggle 不互相覆盖", async () => {
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    render(() => (
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger onClick={onClick}>打开</DropdownMenuTrigger>
        <DropdownMenuContent>内容</DropdownMenuContent>
      </DropdownMenu>
    ));
    const user = userEvent.setup();

    await user.click(trigger());

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });
});

describe("DropdownMenu - ARIA", () => {
  it("trigger 有 aria-haspopup=menu", () => {
    renderMenu();

    expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
  });

  it("关闭时 aria-expanded=false 且无 aria-controls", () => {
    renderMenu();

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).not.toHaveAttribute("aria-controls");
  });

  it("打开时 aria-expanded=true 且 aria-controls 指向 content", () => {
    renderMenu({ defaultOpen: true });

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", content()!.id);
  });

  it("打开时 trigger 带 data-popup-open", () => {
    renderMenu({ defaultOpen: true });

    expect(trigger()).toHaveAttribute("data-popup-open", "");
  });

  it("content 是 role=menu", () => {
    renderMenu({ defaultOpen: true });

    expect(content()).toHaveAttribute("role", "menu");
  });

  it("菜单项是 role=menuitem 且 tabindex=-1", () => {
    renderMenu({ defaultOpen: true });

    expect(items()[0]).toHaveAttribute("role", "menuitem");
    expect(items()[0]).toHaveAttribute("tabindex", "-1");
  });

  it("content 带 data-slot", () => {
    renderMenu({ defaultOpen: true });

    expect(content()).toHaveAttribute("data-slot", "dropdown-menu-content");
  });

  it("disabled 菜单项带 aria-disabled 与 data-disabled", () => {
    renderMenu({
      defaultOpen: true,
      items: [{ label: "禁用项", disabled: true }],
    });

    expect(items()[0]).toHaveAttribute("aria-disabled", "true");
    expect(items()[0]).toHaveAttribute("data-disabled", "");
  });

  it("inset 菜单项带 data-inset", () => {
    render(() => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>打开</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem inset>缩进项</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    expect(items()[0]).toHaveAttribute("data-inset", "");
  });

  it("variant 写入 data-variant", () => {
    render(() => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>打开</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem variant="destructive">删除</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    expect(items()[0]).toHaveAttribute("data-variant", "destructive");
  });
});

describe("DropdownMenu - 菜单项交互", () => {
  it("点击菜单项后菜单关闭，且用户 onClick 被调用", async () => {
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    renderMenu({
      defaultOpen: true,
      onOpenChange,
      items: [{ label: "执行", onClick }],
    });
    const user = userEvent.setup();

    await user.click(items()[0]);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("closeOnClick=false 时点击后菜单保持打开", async () => {
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    renderMenu({
      defaultOpen: true,
      onOpenChange,
      items: [{ label: "执行", closeOnClick: false, onClick }],
    });
    const user = userEvent.setup();

    await user.click(items()[0]);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(content()).toBeInTheDocument();
  });

  it("用户 onClick 里 preventDefault 后不关闭（且回调仍被调用）", async () => {
    const onClick = vi.fn((e: MouseEvent) => e.preventDefault());
    const onOpenChange = vi.fn();
    renderMenu({
      defaultOpen: true,
      onOpenChange,
      items: [{ label: "执行", onClick }],
    });
    const user = userEvent.setup();

    await user.click(items()[0]);

    expect(onClick).toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("点击 disabled 菜单项不触发回调也不关闭", async () => {
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    renderMenu({
      defaultOpen: true,
      onOpenChange,
      items: [{ label: "禁用", disabled: true, onClick }],
    });
    const user = userEvent.setup();

    await user.click(items()[0]);

    expect(onClick).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(content()).toBeInTheDocument();
  });

  it("关闭的 reason 为 item-press", async () => {
    const onOpenChange = vi.fn();
    renderMenu({ defaultOpen: true, onOpenChange });
    const user = userEvent.setup();

    await user.click(items()[0]);

    const details = onOpenChange.mock.calls.at(-1)?.[1] as { reason: string };
    expect(details.reason).toBe("item-press");
  });

  it("hover 菜单项时加上 data-highlighted", async () => {
    renderMenu({ defaultOpen: true });
    const user = userEvent.setup();

    await user.hover(items()[0]);

    expect(items()[0]).toHaveAttribute("data-highlighted", "");
  });
});

describe("DropdownMenu - 关闭行为", () => {
  it("按 Escape 关闭，reason 为 escape-key", () => {
    const onOpenChange = vi.fn();
    renderMenu({ defaultOpen: true, onOpenChange });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    const details = onOpenChange.mock.calls[0][1] as { reason: string };
    expect(details.reason).toBe("escape-key");
  });

  it("点击菜单与触发器之外关闭，reason 为 outside-press", () => {
    const onOpenChange = vi.fn();
    renderMenu({ defaultOpen: true, onOpenChange });

    const outside = document.createElement("div");
    document.body.appendChild(outside);
    fireEvent.pointerDown(outside);

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    const details = onOpenChange.mock.calls[0][1] as { reason: string };
    expect(details.reason).toBe("outside-press");
  });

  it("点击 content 内部不关闭", () => {
    const onOpenChange = vi.fn();
    renderMenu({ defaultOpen: true, onOpenChange });

    fireEvent.pointerDown(content()!);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("点击 trigger 内部不触发 outside-press 关闭", () => {
    const onOpenChange = vi.fn();
    renderMenu({ defaultOpen: true, onOpenChange });

    fireEvent.pointerDown(trigger());

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("关闭状态下按 Escape 不触发回调", () => {
    const onOpenChange = vi.fn();
    renderMenu({ onOpenChange });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("defaultPrevented 的 Escape 不关闭（让上层先处理）", () => {
    const onOpenChange = vi.fn();
    renderMenu({ defaultOpen: true, onOpenChange });
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      cancelable: true,
      bubbles: true,
    });
    event.preventDefault();

    document.dispatchEvent(event);

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("DropdownMenu - 受控模式", () => {
  it("受控 open=false 时点击只回调，UI 不变", async () => {
    const onOpenChange = vi.fn();
    renderMenu({ open: false, onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(content()).toBeNull();
  });

  it("受控 open=true 时 Escape 只回调，UI 不变", () => {
    const onOpenChange = vi.fn();
    renderMenu({ open: true, onOpenChange });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    expect(content()).toBeInTheDocument();
  });

  it("外部回写受控值后 UI 跟随", async () => {
    const [open, setOpen] = createSignal(false);
    render(() => (
      <DropdownMenu open={open()} onOpenChange={setOpen}>
        <DropdownMenuTrigger>打开</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>项</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    expect(content()).toBeNull();

    setOpen(true);
    await Promise.resolve();

    expect(content()).toBeInTheDocument();
  });
});

describe("DropdownMenu - 结构子组件", () => {
  it("Label / Separator / Shortcut 渲染", () => {
    render(() => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>打开</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>分组</DropdownMenuLabel>
          <DropdownMenuItem>
            项 <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    expect(
      document.querySelector('[data-slot="dropdown-menu-label"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="dropdown-menu-separator"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="dropdown-menu-shortcut"]'),
    ).toBeInTheDocument();
  });

  it("Separator 是 role=separator", () => {
    render(() => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>打开</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    expect(
      document.querySelector('[data-slot="dropdown-menu-separator"]'),
    ).toHaveAttribute("role", "separator");
  });
});

describe("DropdownMenu - 复选框与单选组", () => {
  it("CheckboxItem 是 role=menuitemcheckbox，带 aria-checked", () => {
    render(() => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>打开</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>
            显示工具栏
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    const item = document.querySelector(
      '[data-slot="dropdown-menu-checkbox-item"]',
    )!;
    expect(item).toHaveAttribute("role", "menuitemcheckbox");
    expect(item).toHaveAttribute("aria-checked", "true");
  });

  it("点击 CheckboxItem 调用 onCheckedChange", async () => {
    const onCheckedChange = vi.fn();
    render(() => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>打开</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            checked={false}
            onCheckedChange={onCheckedChange}
          >
            选项
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));
    const user = userEvent.setup();

    await user.click(
      document.querySelector('[data-slot="dropdown-menu-checkbox-item"]')!,
    );

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("RadioGroup 是 role=group，RadioItem 是 role=menuitemradio", () => {
    render(() => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>打开</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    expect(
      document.querySelector('[data-slot="dropdown-menu-radio-group"]'),
    ).toHaveAttribute("role", "group");

    const radioItems = document.querySelectorAll(
      '[data-slot="dropdown-menu-radio-item"]',
    );
    expect(radioItems).toHaveLength(2);
    expect(radioItems[0]).toHaveAttribute("role", "menuitemradio");
  });

  it("选中的 RadioItem 带 aria-checked=true，未选中为 false", () => {
    render(() => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>打开</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    const radioItems = document.querySelectorAll(
      '[data-slot="dropdown-menu-radio-item"]',
    );
    expect(radioItems[0]).toHaveAttribute("aria-checked", "true");
    expect(radioItems[1]).toHaveAttribute("aria-checked", "false");
  });

  it("点击 RadioItem 调用 onValueChange", async () => {
    const onValueChange = vi.fn();
    render(() => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>打开</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="a" onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ));
    const user = userEvent.setup();

    await user.click(
      document.querySelectorAll('[data-slot="dropdown-menu-radio-item"]')[1],
    );

    expect(onValueChange).toHaveBeenCalledWith("b", expect.anything());
  });
});

describe("DropdownMenu - 上下文约束", () => {
  it("DropdownMenuTrigger 脱离 DropdownMenu 时抛错", () => {
    expect(() =>
      render(() => <DropdownMenuTrigger>打开</DropdownMenuTrigger>),
    ).toThrow("必须渲染在");
  });

  it("DropdownMenuContent 脱离 DropdownMenu 时抛错", () => {
    expect(() =>
      render(() => (
        <DropdownMenuContent>
          <DropdownMenuItem>项</DropdownMenuItem>
        </DropdownMenuContent>
      )),
    ).toThrow("必须渲染在");
  });
});
